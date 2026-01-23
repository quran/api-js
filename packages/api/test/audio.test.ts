import { describe, expect, it, vi } from "vitest";

import { testClient } from "./test-client";

const VALID_RECITATION_ID = "1";
const VALID_CHAPTER_ID = "1";
const INVALID_CHAPTER_ID = "0";
const VALID_VERSE_KEY = "1:1";
const INVALID_VERSE_KEY = "0:0";

describe("Audio API", () => {
  describe("findAllChapterRecitations()", () => {
    it("should return all chapter recitations for valid reciter", async () => {
      const response =
        await testClient.audio.findAllChapterRecitations(VALID_RECITATION_ID);
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("should call chapter_recitations endpoint", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      try {
        await testClient.audio.findAllChapterRecitations(VALID_RECITATION_ID);
        const contentCall = fetchSpy.mock.calls
          .map((call) => call[0])
          .find(
            (url) =>
              typeof url === "string" && url.includes("/content/api/v4/"),
          );
        expect(contentCall).toBeDefined();
        const contentUrl = new URL(contentCall as string);
        expect(contentUrl.pathname).toBe(
          `/content/api/v4/chapter_recitations/${VALID_RECITATION_ID}`,
        );
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  describe("findChapterRecitationById()", () => {
    it("should return chapter recitation for valid params", async () => {
      const response = await testClient.audio.findChapterRecitationById(
        VALID_RECITATION_ID,
        VALID_CHAPTER_ID,
      );
      expect(response).toBeDefined();
    });

    it("should call chapter_recitations endpoint with chapter id", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");
      try {
        await testClient.audio.findChapterRecitationById(
          VALID_RECITATION_ID,
          VALID_CHAPTER_ID,
        );
        const contentCall = fetchSpy.mock.calls
          .map((call) => call[0])
          .find(
            (url) =>
              typeof url === "string" && url.includes("/content/api/v4/"),
          );
        expect(contentCall).toBeDefined();
        const contentUrl = new URL(contentCall as string);
        expect(contentUrl.pathname).toBe(
          `/content/api/v4/chapter_recitations/${VALID_RECITATION_ID}/${VALID_CHAPTER_ID}`,
        );
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        testClient.audio.findChapterRecitationById(
          VALID_RECITATION_ID,
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByChapter()", () => {
    it("should return verse recitations for valid chapter", async () => {
      const response = await testClient.audio.findVerseRecitationsByChapter(
        VALID_CHAPTER_ID,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        testClient.audio.findVerseRecitationsByChapter(
          // @ts-expect-error - invalid chapter ID
          INVALID_CHAPTER_ID,
          VALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });

  describe("findVerseRecitationsByKey()", () => {
    it("should return verse recitations for valid verse key", async () => {
      const response = await testClient.audio.findVerseRecitationsByKey(
        VALID_VERSE_KEY,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
    });

    it("should throw error for invalid verse key", async () => {
      await expect(
        testClient.audio.findVerseRecitationsByKey(
          // @ts-expect-error - invalid verse key
          INVALID_VERSE_KEY,
          VALID_RECITATION_ID,
        ),
      ).rejects.toThrowError();
    });
  });
});
