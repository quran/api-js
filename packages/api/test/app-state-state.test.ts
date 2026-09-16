import { describe, expect, it } from "vitest";

import type { AppStateChange } from "../src/types/app-state";
import {
  applyAppStateChangePage,
  createAppStateMemoryStore,
  deriveAppStateStateView,
  queueAppStateDelete,
  queueAppStatePut,
} from "../src/runtime/app-state-state";

const THEME_V1: AppStateChange = {
  collection: "settings",
  etag: '"etag-v1"',
  key: "theme",
  operation: "upsert",
  schemaVersion: 1,
  updatedAt: "2026-08-27T00:00:00.000Z",
  value: { mode: "dark" },
  version: 1,
};

const THEME_V2: AppStateChange = {
  ...THEME_V1,
  etag: '"etag-v2"',
  updatedAt: "2026-08-27T00:05:00.000Z",
  value: { mode: "light" },
  version: 2,
};

describe("App State transactional state", () => {
  it("keeps the newer server document when pages arrive out of order", async () => {
    const store = createAppStateMemoryStore();

    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V2], "sync-2");
      applyAppStateChangePage(state, [THEME_V1], "sync-3");
    });

    const view = await store.transaction("account-a", deriveAppStateStateView);
    expect(view.shadow["settings/theme"]?.version).toBe(2);
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "light" });
    expect(view.syncToken).toBe("sync-3");
  });

  it("rejects a same-version conflicting payload without committing its page or token", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V2], "sync-2");
    });

    await expect(
      store.transaction("account-a", (state) => {
        applyAppStateChangePage(
          state,
          [
            {
              ...THEME_V2,
              value: { mode: "conflicting" },
            },
          ],
          "sync-3",
        );
      }),
    ).rejects.toMatchObject({
      code: "same_version_conflict",
    });

    const view = await store.transaction("account-a", deriveAppStateStateView);
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "light" });
    expect(view.syncToken).toBe("sync-2");
  });

  it("retains tombstone lineage metadata while hiding deleted documents", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(
        state,
        [
          THEME_V1,
          {
            ...THEME_V2,
            operation: "delete",
            value: null,
          },
        ],
        "sync-2",
      );
    });

    const view = await store.transaction("account-a", deriveAppStateStateView);
    expect(view.shadow["settings/theme"]).toMatchObject({
      operation: "delete",
      schemaVersion: 1,
      updatedAt: "2026-08-27T00:05:00.000Z",
      version: 2,
    });
    expect(view.visible).not.toHaveProperty("settings/theme");
  });

  it("snapshots queued JSON and returns deeply frozen views", async () => {
    const store = createAppStateMemoryStore();
    const value = { nested: { enabled: true }, sizes: [16, 18] };

    await store.transaction("account-a", (state) => {
      queueAppStatePut(
        state,
        "settings",
        "reader",
        {
          schemaVersion: 1,
          value,
        },
        "mutation-key-0001",
      );
    });
    value.nested.enabled = false;
    value.sizes[0] = 99;

    const view = await store.transaction("account-a", deriveAppStateStateView);
    expect(view.pendingMutations[0]).toMatchObject({
      body: {
        schemaVersion: 1,
        value: { nested: { enabled: true }, sizes: [16, 18] },
      },
      localRevision: 1,
      method: "PUT",
    });
    expect(view.visible["settings/reader"]?.value).toEqual({
      nested: { enabled: true },
      sizes: [16, 18],
    });
    expect(Object.isFrozen(view)).toBe(true);
    const pending = view.pendingMutations[0];
    expect(pending?.method).toBe("PUT");
    if (pending?.method !== "PUT") {
      throw new Error("Expected a queued PUT mutation.");
    }
    expect(Object.isFrozen(pending.body.value)).toBe(true);
    expect(Object.isFrozen(view.visible["settings/reader"]?.value)).toBe(true);
  });

  it("replays pending puts and deletes over shadow without changing server state", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
      queueAppStatePut(
        state,
        "settings",
        "theme",
        { schemaVersion: 1, value: { mode: "sepia" } },
        "mutation-key-0001",
      );
      queueAppStateDelete(state, "settings", "theme", "mutation-key-0002");
    });

    const view = await store.transaction("account-a", deriveAppStateStateView);
    expect(view.shadow["settings/theme"]?.value).toEqual({ mode: "dark" });
    expect(view.visible).not.toHaveProperty("settings/theme");
    expect(view.localRevision).toBe(2);
  });

  it("isolates state by explicit account identifier", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "a-sync-1");
    });

    const accountA = await store.transaction(
      "account-a",
      deriveAppStateStateView,
    );
    const accountB = await store.transaction(
      "account-b",
      deriveAppStateStateView,
    );
    expect(accountA.visible).toHaveProperty("settings/theme");
    expect(accountB.visible).toEqual({});
    expect(accountB.syncToken).toBeNull();
  });

  it("rejects asynchronous reducers without committing their draft", async () => {
    const store = createAppStateMemoryStore();

    await expect(
      store.transaction("account-a", (state) => {
        state.syncToken = "must-not-commit";
        return Promise.resolve();
      }),
    ).rejects.toThrow("App State store reducers must be synchronous.");

    const view = await store.transaction("account-a", deriveAppStateStateView);
    expect(view.syncToken).toBeNull();
  });
});
