import { describe, expect, it } from "vitest";

import { testClient } from "./test-client";

describe("Hadith References API", () => {
  describe("findByAyah()", () => {
    it("should return hadith references for a valid ayah key", async () => {
      const response = await testClient.hadithReferences.findByAyah("12:12");

      expect(response.verseKey).toBe("12:12");
      expect(response.hadithReferences).toHaveLength(2);
      expect(response.hadithReferences[0]).toMatchObject({
        collection: "bukhari",
        hadithNumber: "1",
      });
    });

    it("should throw for invalid ayah keys", async () => {
      await expect(
        // @ts-expect-error - invalid verse key
        testClient.hadithReferences.findByAyah("0:1"),
      ).rejects.toThrowError("Invalid verse key");
    });
  });

  describe("findHadithsByAyah()", () => {
    it("should return paginated hadith payloads for a valid ayah key", async () => {
      const response = await testClient.hadithReferences.findHadithsByAyah(
        "12:12",
        { limit: 4 },
      );

      expect(response.hadiths[0]?.collection).toBe("bukhari");
      expect(response.hadiths[0]?.hadith[0]?.grades[0]?.gradedBy).toBe(
        "Ahmad Muhammad Shakir",
      );
      expect(response.hasMore).toBe(true);
    });
  });

  describe("countWithinRange()", () => {
    it("should return hadith counts for a verse range", async () => {
      await expect(
        testClient.hadithReferences.countWithinRange("12:12", "12:13"),
      ).resolves.toEqual({
        "12:12": 2,
        "12:13": 2,
      });
    });

    it("should expose the same methods through content.v4", async () => {
      const response =
        await testClient.content.v4.hadithReferences.byAyah("12:12");

      expect(response.hadithReferences[1]?.collection).toBe("muslim");
    });
  });
});
