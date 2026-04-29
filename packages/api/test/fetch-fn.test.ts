import { describe, expect, it } from "vitest";

import { createServerClient } from "../src/server";

describe("Custom fetcher", () => {
  it("should fail with no fetch", () => {
    // @ts-expect-error - we are testing this
    globalThis.fetch = undefined;

    expect(
      () =>
        createServerClient({
          clientId: "test",
          clientSecret: "test",
        }),
    ).toThrowError(/No fetch function available/);
  });

  it("should not fail if you pass a fetchFn", async () => {
    // Save the original fetch that MSW has mocked
    const originalFetch = globalThis.fetch;

    // @ts-expect-error - we are testing this
    globalThis.fetch = undefined;

    const client = createServerClient({
      clientId: "test",
      clientSecret: "test",
      fetch: originalFetch,
    });

    await expect(client.chapters.findById("1")).resolves.not.toThrow();
  });
});
