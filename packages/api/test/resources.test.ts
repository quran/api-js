import { describe, expect, it } from "vitest";

import { quran } from "../src/index";

const VALID_RECITATION_ID = "1";
const VALID_TRANSLATION_ID = "1";
const VALID_TAFSIR_ID = "169";

describe("Resources API", () => {
  describe("findAllChapterInfos()", () => {
    it("should return an array of chapter infos", async () => {
      const response = await quran.v4.resources.findAllChapterInfos();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllChapterReciters()", () => {
    it("should return an array of chapter reciters", async () => {
      const response = await quran.v4.resources.findAllChapterReciters();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllLanguages()", () => {
    it("should return an array of languages", async () => {
      const response = await quran.v4.resources.findAllLanguages();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllRecitationStyles()", () => {
    it("should return recitation styles (not an array)", async () => {
      const response = await quran.v4.resources.findAllRecitationStyles();
      expect(response).toBeDefined();
      // Note: This method returns an object, not an array despite containing "All" in name
      expect(response).not.toBeInstanceOf(Array);
    });
  });

  describe("findAllRecitations()", () => {
    it("should return an array of recitations", async () => {
      const response = await quran.v4.resources.findAllRecitations();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllTafsirs()", () => {
    it("should return an array of tafsirs", async () => {
      const response = await quran.v4.resources.findAllTafsirs();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllTranslations()", () => {
    it("should return an array of translations", async () => {
      const response = await quran.v4.resources.findAllTranslations();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findVerseMedia()", () => {
    it("should return verse media information", async () => {
      const response = await quran.v4.resources.findVerseMedia();
      expect(response).toBeDefined();
    });
  });

  describe("findRecitationInfo()", () => {
    it("should return recitation info for valid ID", async () => {
      const response =
        await quran.v4.resources.findRecitationInfo(VALID_RECITATION_ID);
      expect(response).toBeDefined();
    });
  });

  describe("findTranslationInfo()", () => {
    it("should return translation info for valid ID", async () => {
      const response =
        await quran.v4.resources.findTranslationInfo(VALID_TRANSLATION_ID);
      expect(response).toBeDefined();
    });
  });

  describe("findTafsirInfo()", () => {
    it("should return tafsir info for valid ID", async () => {
      const response = await quran.v4.resources.findTafsirInfo(VALID_TAFSIR_ID);
      expect(response).toBeDefined();
    });
  });
});
