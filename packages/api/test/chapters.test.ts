import { describe, expect, it } from "vitest";

import { quran } from "../src/index";

describe("Chapters API", () => {
  describe("findAll()", () => {
    it("should return an array of chapters", async () => {
      const response = await quran.v4.chapters.findAll();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findById()", () => {
    it("should return chapter for valid chapter ID", async () => {
      const response = await quran.v4.chapters.findById("1");
      expect(response).toBeDefined();
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        // @ts-expect-error - invalid chapter ID
        quran.v4.chapters.findById("0"),
      ).rejects.toThrowError();
    });
  });

  describe("findInfoById()", () => {
    it("should return chapter info for valid chapter ID", async () => {
      const response = await quran.v4.chapters.findInfoById("1");
      expect(response).toBeDefined();
    });

    it("should throw error for invalid chapter ID", async () => {
      await expect(
        // @ts-expect-error - invalid chapter ID
        quran.v4.chapters.findInfoById("0"),
      ).rejects.toThrowError();
    });
  });
});
