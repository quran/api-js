import { describe, expect, it } from "vitest";

import { testClient } from "./test-client";

describe("Chapters API", () => {
  describe("findAll()", () => {
    it("should return an array of chapters", async () => {
      const response = await testClient.chapters.findAll();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findById()", () => {
    it("should return chapter for valid chapter ID", async () => {
      const response = await testClient.chapters.findById("1");
      expect(response).toBeDefined();
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        // @ts-expect-error - invalid chapter ID
        testClient.chapters.findById("0"),
      ).rejects.toThrowError();
    });
  });

  describe("findInfoById()", () => {
    it("should return chapter info for valid chapter ID", async () => {
      const response = await testClient.chapters.findInfoById("1");
      expect(response).toBeDefined();
      expect(response?.resourceId).toBe(58);
    });

    it("should return the full chapter info response with resources", async () => {
      const response = await testClient.chapters.findInfoResponseById("1", {
        includeResources: true,
        resourceId: 58,
      });

      expect(response.chapterInfo?.resourceId).toBe(58);
      expect(response.resources).toBeInstanceOf(Array);
      expect(response.resources?.[0]?.id).toBe(58);
    });

    it("should support resource slugs when selecting chapter info", async () => {
      const response = await testClient.chapters.findInfoResponseById("1", {
        resourceId: "en-tafsir-ibn-ashur",
      });

      expect(response.chapterInfo?.resourceId).toBe(167);
    });

    it("should support null chapter info for missing resources", async () => {
      const response = await testClient.chapters.findInfoResponseById("1", {
        resourceId: "missing-resource",
      });

      expect(response.chapterInfo).toBeNull();
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        // @ts-expect-error - invalid chapter ID
        testClient.chapters.findInfoById("0"),
      ).rejects.toThrowError();
    });
  });
});
