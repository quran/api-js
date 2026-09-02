import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type { AppStateChange } from "../src/types/app-state";
import {
  applyAppStateChangePage,
  createAppStateMemoryStore,
  deriveAppStateStateView,
} from "../src/runtime/app-state-state";

const FIXTURE_SHA256 =
  "e2fcdf4c3b7530e8ab8472c4d72bd368db11218f1a46a62d33a147c0a9ce94ad";

interface FixturePage {
  changes: string[];
  hasMore: boolean;
  nextSyncToken: string;
}

interface FixtureScenario {
  expected: {
    protocolError: string | null;
    syncToken: string;
    themeValue?: { mode: string };
    themeVersion?: number;
    transactionCommitted?: boolean;
  };
  initial: {
    shadow: Record<string, string>;
    syncToken: string;
  };
  name: string;
  page?: FixturePage & { changes: AppStateChange[] };
  pages?: FixturePage[];
}

interface ReconciliationFixture {
  documents: Record<string, AppStateChange>;
  scenarios: FixtureScenario[];
}

const loadFixture = async (): Promise<ReconciliationFixture> =>
  JSON.parse(
    await readFile(
      path.join(
        process.cwd(),
        "conformance",
        "app-state-reconciliation-v1.json",
      ),
      "utf8",
    ),
  ) as ReconciliationFixture;

describe("App State reconciliation conformance fixture", () => {
  it("retains the canonical fixture bytes and published checksum", async () => {
    const fixturePath = path.join(
      process.cwd(),
      "conformance",
      "app-state-reconciliation-v1.json",
    );
    const checksumPath = path.join(
      process.cwd(),
      "conformance",
      "app-state-reconciliation-v1.sha256",
    );

    const [fixture, checksum] = await Promise.all([
      readFile(fixturePath),
      readFile(checksumPath, "utf8"),
    ]);

    expect(createHash("sha256").update(fixture).digest("hex")).toBe(
      FIXTURE_SHA256,
    );
    expect(checksum.trim()).toBe(FIXTURE_SHA256);
  });

  it.each([
    "duplicate_change_is_idempotent",
    "out_of_order_pages_keep_newest_document",
  ])("matches the %s state transition", async (scenarioName) => {
    const fixture = await loadFixture();
    const scenario = fixture.scenarios.find(
      ({ name }) => name === scenarioName,
    )!;
    const store = createAppStateMemoryStore();

    await store.transaction("fixture-account", (state) => {
      state.syncToken = scenario.initial.syncToken;
      for (const page of scenario.pages!) {
        applyAppStateChangePage(
          state,
          page.changes.map((name) => fixture.documents[name]!),
          page.nextSyncToken,
        );
      }
    });

    const view = await store.transaction(
      "fixture-account",
      deriveAppStateStateView,
    );
    expect(view.visible["settings/theme"]?.version).toBe(
      scenario.expected.themeVersion,
    );
    expect(view.visible["settings/theme"]?.value).toEqual(
      scenario.expected.themeValue,
    );
    expect(view.syncToken).toBe(scenario.expected.syncToken);
  });

  it("matches the fixture's same-version conflict rollback", async () => {
    const fixture = await loadFixture();
    const scenario = fixture.scenarios.find(
      ({ name }) =>
        name === "same_version_conflicting_payload_is_protocol_error",
    )!;
    const store = createAppStateMemoryStore();
    await store.transaction("fixture-account", (state) => {
      state.shadow["settings/theme"] = fixture.documents.themeV3!;
      state.syncToken = scenario.initial.syncToken;
    });

    await expect(
      store.transaction("fixture-account", (state) => {
        applyAppStateChangePage(
          state,
          scenario.page!.changes,
          scenario.page!.nextSyncToken,
        );
      }),
    ).rejects.toMatchObject({ code: scenario.expected.protocolError });
    const view = await store.transaction(
      "fixture-account",
      deriveAppStateStateView,
    );
    expect(view.syncToken).toBe(scenario.expected.syncToken);
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "sepia" });
  });
});
