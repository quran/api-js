import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { SearchMode } from "../src";
import { server } from "../mocks/server";
import { testClient } from "./test-client";

const SEARCH_URL = "https://apis.quran.foundation/v1/search";

const baseResponse = {
  result: {
    navigation: [],
    verses: [],
  },
  pagination: {
    current_page: 1,
    next_page: null,
    per_page: 30,
    total_pages: 1,
    total_records: 0,
  },
};

describe("Search API", () => {
  it("camelizes the response payload", async () => {
    server.use(
      http.get(SEARCH_URL, () => {
        return HttpResponse.json({
          result: {
            navigation: [
              {
                result_type: "surah",
                key: "1",
                name: "Al-Fatihah",
              },
            ],
            verses: [],
          },
          pagination: {
            current_page: 1,
            next_page: null,
            per_page: 30,
            total_pages: 1,
            total_records: 1,
          },
        });
      }),
    );

    const response = await testClient.search.search("test", {
      mode: SearchMode.Quick,
    });

    expect(response.pagination.currentPage).toBe(1);
    expect(response.pagination.nextPage).toBeNull();
    expect(response.result?.navigation[0].resultType).toBe("surah");
  });

  it("sends query, mode, and default size", async () => {
    let requestUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(baseResponse);
      }),
    );

    await testClient.search.search("test", { mode: SearchMode.Quick });

    expect(requestUrl).not.toBeNull();
    const params = requestUrl?.searchParams;
    expect(params?.get("query")).toBe("test");
    expect(params?.get("mode")).toBe("quick");
    expect(params?.get("size")).toBe("30");
  });

  it("serializes advanced search params", async () => {
    let requestUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(baseResponse);
      }),
    );

    await testClient.search.search("test", {
      mode: SearchMode.Advanced,
      exactMatchesOnly: "1",
      getText: "1",
      highlight: "0",
      page: 2,
      size: 12,
    });

    const params = requestUrl?.searchParams;
    expect(params?.get("exact_matches_only")).toBe("1");
    expect(params?.get("get_text")).toBe("1");
    expect(params?.get("highlight")).toBe("0");
    expect(params?.get("page")).toBe("2");
    expect(params?.get("size")).toBe("12");
  });

  it("preserves quick search result keys without decamelizing", async () => {
    let requestUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(baseResponse);
      }),
    );

    await testClient.search.search("test", {
      mode: SearchMode.Quick,
      navigationalResultsNumber: 7,
      versesResultsNumber: 9,
    });

    const params = requestUrl?.searchParams;
    expect(params?.get("navigationalResultsNumber")).toBe("7");
    expect(params?.get("versesResultsNumber")).toBe("9");
    expect(params?.has("navigational_results_number")).toBe(false);
    expect(params?.has("verses_results_number")).toBe(false);
  });

  it("serializes arrays, booleans, and field selections", async () => {
    let requestUrl: URL | null = null;
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(baseResponse);
      }),
    );

    await testClient.search.search("test", {
      mode: SearchMode.Quick,
      translationIds: [131, 20],
      filterTranslations: ["en", "ar"],
      indexes: ["verses", "chapters"],
      words: true,
      fields: {
        textUthmani: true,
        codeV2: false,
      },
      wordFields: {
        verseKey: true,
        location: true,
      },
      translationFields: {
        resourceName: true,
        languageName: true,
      },
    });

    const params = requestUrl?.searchParams;
    expect(params?.get("translation_ids")).toBe("131,20");
    expect(params?.get("filter_translations")).toBe("en,ar");
    expect(params?.get("indexes")).toBe("verses,chapters");
    expect(params?.get("words")).toBe("true");

    const fields = params?.get("fields")?.split(",") ?? [];
    expect(fields).toContain("text_uthmani");
    expect(fields).not.toContain("code_v2");

    const wordFields = params?.get("word_fields")?.split(",") ?? [];
    expect(wordFields).toContain("verse_key");
    expect(wordFields).toContain("location");

    const translationFields =
      params?.get("translation_fields")?.split(",") ?? [];
    expect(translationFields).toContain("resource_name");
    expect(translationFields).toContain("language_name");
  });
});
