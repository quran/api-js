import fetch from "cross-fetch";
import { describe, expect, it } from "vitest";

import { quran } from "../src";

describe("Custom fetcher", () => {
  it("should fail with no fetch", async () => {
    // @ts-expect-error - we are testing this
    globalThis.fetch = undefined;

    await expect(quran.v4.chapters.findAll()).rejects.toThrowError(
      /global fetch/,
    );
  });

  it("should not fail if you pass a fetchFn", async () => {
    // @ts-expect-error - we are testing this
    globalThis.fetch = undefined;

    await expect(
      quran.v4.chapters.findById("1", {
        fetchFn: async (url) => {
          const res = await fetch(url);
          return res.json() as Promise<Record<string, unknown>>;
        },
      }),
    ).resolves.not.toThrow();
  });
});
