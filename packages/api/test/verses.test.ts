import { describe, expect, it } from "vitest";

import { testClient } from "./test-client";

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
        testClient.verses.findByChapter(INVALID_CHAPTER_ID as any),
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
        testClient.verses.findByJuz(INVALID_JUZ_NUMBER as any),
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
        testClient.verses.findByKey(INVALID_VERSE_KEY as any),
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
        testClient.verses.findByPage(INVALID_PAGE_NUMBER as any),
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
        testClient.verses.findByHizb(INVALID_HIZB_NUMBER as any),
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
        testClient.verses.findByRub(INVALID_CHAPTER_ID as any),
      ).rejects.toThrowError();
    });
  });
});
