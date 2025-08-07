import { describe, expect, it } from "vitest";

import { quran } from "../src/index";

const VALID_RECITATION_ID = "2"; // abdulbaset abdulsamad
const VALID_CHAPTER_ID = "1";
const VALID_VERSE_KEY = "1:1";
const VALID_HIZB_NUMBER = "1";
const VALID_JUZ_NUMBER = "1";
const VALID_PAGE_NUMBER = "1";
const VALID_RUB_NUMBER = "1";

const INVALID_CHAPTER_ID = "0";
const INVALID_RECITATION_ID = "0";
const INVALID_VERSE_KEY = "0:0";

describe("Audio API", () => {
  describe("findAllChapterRecitations()", () => {
    it("should return an array of chapter recitations", async () => {
      const response =
        await quran.v4.audio.findAllChapterRecitations(VALID_RECITATION_ID);
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findChapterRecitationById()", () => {
    it("should return chapter recitation for valid params", async () => {
      const response = await quran.v4.audio.findChapterRecitationById(
        VALID_CHAPTER_ID,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findChapterRecitationById(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByChapter()", () => {
    it("should return verse recitations for valid chapter", async () => {
      const response = await quran.v4.audio.findVerseRecitationsByChapter(
        VALID_CHAPTER_ID,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findVerseRecitationsByChapter(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByHizb()", () => {
    it("should return verse recitations for valid hizb", async () => {
      const response = await quran.v4.audio.findVerseRecitationsByHizb(
        VALID_HIZB_NUMBER,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findVerseRecitationsByHizb(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByJuz()", () => {
    it("should return verse recitations for valid juz", async () => {
      const response = await quran.v4.audio.findVerseRecitationsByJuz(
        VALID_JUZ_NUMBER,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findVerseRecitationsByJuz(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByKey()", () => {
    it("should return verse recitations for valid verse key", async () => {
      const response = await quran.v4.audio.findVerseRecitationsByKey(
        VALID_VERSE_KEY,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findVerseRecitationsByKey(
          // @ts-expect-error - invalid verse key
          INVALID_VERSE_KEY,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByPage()", () => {
    it("should return verse recitations for valid page", async () => {
      const response = await quran.v4.audio.findVerseRecitationsByPage(
        VALID_PAGE_NUMBER,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findVerseRecitationsByPage(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByRub()", () => {
    it("should return verse recitations for valid rub", async () => {
      const response = await quran.v4.audio.findVerseRecitationsByRub(
        VALID_RUB_NUMBER,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid params", async () => {
      await expect(
        quran.v4.audio.findVerseRecitationsByRub(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          INVALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });
});
