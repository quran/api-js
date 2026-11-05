import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { createServerClient } from "../src/server";
import { testClient } from "./test-client";

const VERSES_URL = "https://apis.quran.foundation/content/api/v4/verses";

const VALID_CHAPTER_ID = "1";
const VALID_JUZ_NUMBER = "1";
const VALID_VERSE_KEY = "1:1";
const VALID_PAGE_NUMBER = "1";
const VALID_HIZB_NUMBER = "1";
const VALID_RUB_NUMBER = "1";

const INVALID_CHAPTER_ID = "0";
const INVALID_JUZ_NUMBER = "0";
const INVALID_VERSE_KEY = "0:0";
const INVALID_PAGE_NUMBER = "0";
const INVALID_HIZB_NUMBER = "0";

describe("Verses API", () => {
  describe("findByChapter()", () => {
    it("should return an array of verses for valid chapter", async () => {
      const response = await testClient.verses.findByChapter(VALID_CHAPTER_ID);
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        // @ts-expect-error - testing invalid chapter ID
        testClient.verses.findByChapter(INVALID_CHAPTER_ID),
      ).rejects.toThrowError();
    });
  });

  describe("findByJuz()", () => {
    it("should return an array of verses for valid juz", async () => {
      const response = await testClient.verses.findByJuz(VALID_JUZ_NUMBER);
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("should throw error for invalid juz number", async () => {
      await expect(
        // @ts-expect-error - testing invalid juz number
        testClient.verses.findByJuz(INVALID_JUZ_NUMBER),
      ).rejects.toThrowError();
    });
  });

  describe("findByKey()", () => {
    it("should return verse for valid verse key", async () => {
      const response = await testClient.verses.findByKey(VALID_VERSE_KEY);
      expect(response).toBeDefined();
    });

    it("should throw error for invalid verse key", async () => {
      await expect(
        // @ts-expect-error - testing invalid verse key
        testClient.verses.findByKey(INVALID_VERSE_KEY),
      ).rejects.toThrowError("Invalid verse key");
    });

    it.each(["01:300", "1.5:1", "1:1.5", "1:1:1", "0x2:255", " 2:255 "])(
      "should throw error for malformed verse key %s",
      async (key) => {
        await expect(
          // @ts-expect-error - testing malformed verse key
          testClient.verses.findByKey(key),
        ).rejects.toThrowError("Invalid verse key");
      },
    );
  });

  describe("findByRange()", () => {
    it("should return verses for valid range", async () => {
      const response = await testClient.verses.findByRange(
        VALID_VERSE_KEY,
        VALID_VERSE_KEY,
      );
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("should throw error when 'from' key is invalid", async () => {
      await expect(
        // @ts-expect-error - testing invalid verse key
        testClient.verses.findByRange(INVALID_VERSE_KEY, VALID_VERSE_KEY),
      ).rejects.toThrowError();
    });

    it("should throw error when 'to' key is invalid", async () => {
      await expect(
        // @ts-expect-error - testing invalid verse key
        testClient.verses.findByRange(VALID_VERSE_KEY, INVALID_VERSE_KEY),
      ).rejects.toThrowError();
    });
  });

  describe("findByPage()", () => {
    it("should return an array of verses for valid page", async () => {
      const response = await testClient.verses.findByPage(VALID_PAGE_NUMBER);
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("should throw error for invalid page number", async () => {
      await expect(
        // @ts-expect-error - testing invalid page number
        testClient.verses.findByPage(INVALID_PAGE_NUMBER),
      ).rejects.toThrowError();
    });
  });

  describe("findRandom()", () => {
    it("should return a random verse", async () => {
      const response = await testClient.verses.findRandom();
      expect(response).toBeDefined();
    });
  });

  describe("findByHizb()", () => {
    it("should return an array of verses for valid hizb", async () => {
      const response = await testClient.verses.findByHizb(VALID_HIZB_NUMBER);
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("should throw error for invalid hizb number", async () => {
      await expect(
        // @ts-expect-error - testing invalid hizb number
        testClient.verses.findByHizb(INVALID_HIZB_NUMBER),
      ).rejects.toThrowError();
    });
  });

  describe("findByRub()", () => {
    it("should return verses for valid rub", async () => {
      const response = await testClient.verses.findByRub(VALID_RUB_NUMBER);
      expect(response).toBeDefined();
    });

    it("should throw error for invalid rub number", async () => {
      await expect(
        // @ts-expect-error - testing invalid rub number
        testClient.verses.findByRub(INVALID_CHAPTER_ID),
      ).rejects.toThrowError();
    });
  });

  describe("audio option", () => {
    it("sends the recitation id as audio", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(`${VERSES_URL}/by_key/:verse_key`, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({
            verse: {
              id: 1,
              verse_key: "1:1",
              audio: { url: "Alafasy/mp3/001001.mp3" },
            },
          });
        }),
      );

      const verse = await testClient.verses.findByKey(VALID_VERSE_KEY, {
        audio: 7,
      });

      expect(requestUrl!.searchParams.get("audio")).toBe("7");
      expect(verse.audio?.url).toBe("Alafasy/mp3/001001.mp3");
    });

    it("sends the deprecated reciter option as audio", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(`${VERSES_URL}/by_chapter/:chapter_number`, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({ verses: [] });
        }),
      );

      await testClient.verses.findByChapter(VALID_CHAPTER_ID, { reciter: 7 });

      const params = requestUrl!.searchParams;
      expect(params.get("audio")).toBe("7");
      expect(params.has("reciter")).toBe(false);
    });

    it("prefers audio over the deprecated reciter option", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(`${VERSES_URL}/by_range`, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({ verses: [] });
        }),
      );

      await testClient.content.v4.verses.byRange("1:1", "1:7", {
        audio: 7,
        reciter: 1,
      });

      const params = requestUrl!.searchParams;
      expect(params.get("audio")).toBe("7");
      expect(params.has("reciter")).toBe(false);
      expect(params.get("from")).toBe("1:1");
      expect(params.get("to")).toBe("1:7");
    });

    it("keeps a client default audio when a call passes none", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(`${VERSES_URL}/by_key/:verse_key`, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({ verse: { id: 1, verse_key: "1:1" } });
        }),
      );

      const client = createServerClient({
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        defaults: { audio: 7 },
      });
      await client.verses.findByKey(VALID_VERSE_KEY, { words: true });

      expect(requestUrl!.searchParams.get("audio")).toBe("7");
    });
  });
});
