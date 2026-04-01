import { describe, expect, it } from "vitest";

import { paramsToString, removeBeginningSlash } from "../src/lib/url";
import { Language } from "../src/types";

describe("URL helpers", () => {
  it("removes a leading slash from paths", () => {
    expect(removeBeginningSlash("/content/api")).toBe("content/api");
    expect(removeBeginningSlash("content/api")).toBe("content/api");
  });

  it("returns an empty string when no params are supplied", () => {
    expect(paramsToString()).toBe("");
    expect(paramsToString({})).toBe("");
  });

  it("serialises complex query parameters correctly", () => {
    const query = paramsToString({
      language: Language.ENGLISH,
      page: 2,
      perPage: 25,
      words: true,
      translations: [1, 2, 3],
      fields: {
        textUthmani: true,
        codeV1: false,
      },
      wordFields: {
        textUthmani: true,
        codeV2: true,
      },
      translationFields: {
        verseKey: true,
        languageName: false,
      },
    });

    expect(query.startsWith("?")).toBe(true);

    const searchParams = new URLSearchParams(query.slice(1));

    expect(searchParams.get("language")).toBe(Language.ENGLISH);
    expect(searchParams.get("page")).toBe("2");
    expect(searchParams.get("per_page")).toBe("25");
    expect(searchParams.get("words")).toBe("true");
    expect(searchParams.get("translations")).toBe("1,2,3");
    expect(searchParams.get("fields")).toBe("text_uthmani");
    expect(searchParams.get("word_fields")).toBe("text_uthmani,code_v2");
    expect(searchParams.get("translation_fields")).toBe("verse_key");
  });
});
