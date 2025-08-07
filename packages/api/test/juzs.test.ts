import { describe, expect, it } from "vitest";

import { quran } from "../src/index";

describe("Juzs API", () => {
  describe("findAll()", () => {
    it("should return an array of juzs", async () => {
      const response = await quran.v4.juzs.findAll();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });
});
