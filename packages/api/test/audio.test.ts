import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { server } from "../mocks/server";
import { testClient } from "./test-client";

const CHAPTER_RECITATION_URL =
  "https://apis.quran.foundation/content/api/v4/chapter_recitations/:id/:chapter_number";
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

    it("requests word timings and returns typed verse timestamps", async () => {
      const requestUrls: URL[] = [];
      server.use(
        http.get(CHAPTER_RECITATION_URL, ({ request }) => {
          requestUrls.push(new URL(request.url));
          return HttpResponse.json({
            audio_file: {
              id: 911,
              chapter_id: 1,
              file_size: 839808,
              format: "mp3",
              audio_url:
                "https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/1.mp3",
              timestamps: [
                {
                  verse_key: "1:1",
                  timestamp_from: 0,
                  timestamp_to: 6090,
                  duration: 6090,
                  segments: [
                    [1, 0, 580],
                    [2, 580, 1409],
                    [3, 1409, 2502],
                    [4, 2502, 5840],
                  ],
                },
                {
                  verse_key: "1:2",
                  timestamp_from: 6090,
                  timestamp_to: 10710,
                  duration: 4620,
                  // Legacy data has entries shorter than a triplet.
                  segments: [[5, 7902], [12231]],
                },
              ],
            },
          });
        }),
      );

      const audioFile = await testClient.audio.findChapterRecitationById(
        VALID_RECITATION_ID,
        VALID_CHAPTER_ID,
        { segments: true },
      );
      await testClient.content.v4.audio.chapterRecitation.get(
        VALID_RECITATION_ID,
        VALID_CHAPTER_ID,
        { segments: true },
      );

      expect(
        requestUrls.map((url) => url.searchParams.get("segments")),
      ).toEqual(["true", "true"]);
      const [timestamp] = audioFile.timestamps ?? [];
      expect(timestamp?.verseKey).toBe("1:1");
      expect(timestamp?.timestampFrom).toBe(0);
      expect(timestamp?.timestampTo).toBe(6090);
      expect(timestamp?.duration).toBe(6090);
      expect(timestamp?.segments?.[0]).toEqual([1, 0, 580]);

      const [wordIndex, startMs, endMs] =
        audioFile.timestamps?.[1]?.segments?.[1] ?? [];
      expect(wordIndex).toBe(12231);
      expect(startMs).toBeUndefined();
      expect(endMs).toBeUndefined();
    });
  });

  describe("findVerseRecitationsByChapter()", () => {
    it("should return verse recitations for valid chapter", async () => {
      const response = await testClient.audio.findVerseRecitationsByChapter(
        VALID_CHAPTER_ID,
        VALID_RECITATION_ID,
      );
      expect(response).toBeDefined();
      expect(response.audioFiles).toBeInstanceOf(Array);
    });

    it("should normalize relative URLs to absolute audioUrl", async () => {
      const response = await testClient.audio.findVerseRecitationsByChapter(
        VALID_CHAPTER_ID,
        VALID_RECITATION_ID,
      );
      expect(response.audioFiles[0]).toBeDefined();
      // The relative URL from the mock
      expect(response.audioFiles[0]?.url).toBe(
        "AbdulBaset/Murattal/mp3/001001.mp3",
      );
      // The normalized absolute URL
      expect(response.audioFiles[0]?.audioUrl).toBe(
        "https://verses.quran.com/AbdulBaset/Murattal/mp3/001001.mp3",
      );
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
      expect(response.audioFiles).toBeInstanceOf(Array);
    });

    it("should normalize relative URLs to absolute audioUrl", async () => {
      const response = await testClient.audio.findVerseRecitationsByKey(
        VALID_VERSE_KEY,
        VALID_RECITATION_ID,
      );
      expect(response.audioFiles[0]).toBeDefined();
      expect(response.audioFiles[0]?.url).toBe(
        "AbdulBaset/Murattal/mp3/001001.mp3",
      );
      expect(response.audioFiles[0]?.audioUrl).toBe(
        "https://verses.quran.com/AbdulBaset/Murattal/mp3/001001.mp3",
      );
    });

    it("should preserve already absolute URLs as audioUrl", async () => {
      const response = await testClient.audio.findVerseRecitationsByKey(
        VALID_VERSE_KEY,
        VALID_RECITATION_ID,
      );
      const absoluteUrl =
        "https://verses.quran.com/AbdulBaset/Murattal/mp3/001001.mp3";
      expect(response.audioFiles[1]).toBeDefined();
      expect(response.audioFiles[1]?.url).toBe(absoluteUrl);
      expect(response.audioFiles[1]?.audioUrl).toBe(absoluteUrl);
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
