import { describe, expect, it, vi } from "vitest";

import { QuranSearch } from "../src/sdk/search";
import type { QuranFetcher } from "../src/sdk/fetcher";
import { Language } from "../src/types";

describe("Search API", () => {
  it("uses the default page size when none is provided", async () => {
    const fakeFetcher = {
      fetch: vi.fn().mockResolvedValue({
        search: {
          query: "mercy",
          totalResults: 1,
          currentPage: 1,
          totalPages: 1,
          results: [],
        },
      }),
    } as unknown as QuranFetcher;

    const searchApi = new QuranSearch(fakeFetcher);

    const result = await searchApi.search("mercy");

    expect(fakeFetcher.fetch).toHaveBeenCalledWith(
      "/content/api/v4/search",
      {
        q: "mercy",
        size: 30,
      },
    );
    expect(result).toEqual({
      query: "mercy",
      totalResults: 1,
      currentPage: 1,
      totalPages: 1,
      results: [],
    });
  });

  it("merges custom options with the query", async () => {
    const fakeFetcher = {
      fetch: vi.fn().mockResolvedValue({
        search: {
          query: "mercy",
          totalResults: 2,
          currentPage: 2,
          totalPages: 5,
          results: [],
        },
      }),
    } as unknown as QuranFetcher;

    const searchApi = new QuranSearch(fakeFetcher);

    await searchApi.search("mercy", {
      size: 10,
      page: 2,
      language: Language.ENGLISH,
    });

    expect(fakeFetcher.fetch).toHaveBeenLastCalledWith(
      "/content/api/v4/search",
      {
        q: "mercy",
        size: 10,
        page: 2,
        language: Language.ENGLISH,
      },
    );
  });
});
