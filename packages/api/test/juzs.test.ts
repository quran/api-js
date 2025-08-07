import { describe, expect, it } from "vitest";

import { testClient } from "./test-client";

describe("Juzs API", () => {
  describe("findAll()", () => {
    it("should return an array of juzs", async () => {
      const response = await testClient.juzs.findAll();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });
});
