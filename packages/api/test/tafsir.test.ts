import { describe, expect, it } from "vitest";

import { testClient } from "./test-client";

const RESOURCE_ID = "169";

describe("Tafsir API", () => {
  describe("get()", () => {
    it("should return a single tafsir payload", async () => {
      const response = await testClient.tafsir.get(RESOURCE_ID);
      expect(response.tafsirs).toBeInstanceOf(Array);
    });
  });

  describe("findByChapter()", () => {
    it("should return tafsirs for a chapter", async () => {
      const response = await testClient.tafsir.findByChapter(RESOURCE_ID, "1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });

    it("should throw for invalid chapter id", async () => {
      await expect(
        // @ts-expect-error - invalid chapter id
        testClient.tafsir.findByChapter(RESOURCE_ID, "0"),
      ).rejects.toThrowError();
    });
  });

  describe("findByPage()", () => {
    it("should return tafsirs for a page", async () => {
      const response = await testClient.tafsir.findByPage(RESOURCE_ID, "1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });
  });

  describe("findByJuz()", () => {
    it("should return tafsirs for a juz", async () => {
      const response = await testClient.tafsir.findByJuz(RESOURCE_ID, "1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });
  });

  describe("findByHizb()", () => {
    it("should return tafsirs for a hizb", async () => {
      const response = await testClient.tafsir.findByHizb(RESOURCE_ID, "1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });
  });

  describe("findByRub()", () => {
    it("should return tafsirs for a rub", async () => {
      const response = await testClient.tafsir.findByRub(RESOURCE_ID, "1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });

    it("should throw for invalid rub number", async () => {
      await expect(
        // @ts-expect-error - invalid rub number
        testClient.tafsir.findByRub(RESOURCE_ID, "0"),
      ).rejects.toThrowError();
    });
  });

  describe("findByRubElHizb()", () => {
    it("should return tafsirs for a rub el hizb", async () => {
      const response = await testClient.tafsir.findByRubElHizb(RESOURCE_ID, "1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });
  });

  describe("findByAyah()", () => {
    it("should return tafsirs for an ayah", async () => {
      const response = await testClient.tafsir.findByAyah(RESOURCE_ID, "1:1");
      expect(response.tafsirs).toBeInstanceOf(Array);
    });

    it("should throw for invalid verse key", async () => {
      await expect(
        // @ts-expect-error - invalid verse key
        testClient.tafsir.findByAyah(RESOURCE_ID, "0:0"),
      ).rejects.toThrowError();
    });
  });
});
