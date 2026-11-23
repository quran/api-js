import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { testClient } from "./test-client";

const JUZS_URL = "https://apis.quran.foundation/content/api/v4/juzs";

describe("Juzs API", () => {
  describe("findAll()", () => {
    it("should return an array of juzs", async () => {
      const response = await testClient.juzs.findAll();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });

    it("sends the mushaf option", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(JUZS_URL, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({ juzs: [] });
        }),
      );

      await testClient.juzs.findAll({ mushaf: 6 });

      expect(requestUrl!.searchParams.get("mushaf")).toBe("6");
    });

    it("sends no mushaf when none is given", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(JUZS_URL, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({ juzs: [] });
        }),
      );

      await testClient.juzs.findAll();

      expect(requestUrl!.searchParams.has("mushaf")).toBe(false);
    });
  });

  describe("content.v4.juzs.list()", () => {
    it("passes its query to the API", async () => {
      let requestUrl: URL | null = null;
      server.use(
        http.get(JUZS_URL, ({ request }) => {
          requestUrl = new URL(request.url);
          return HttpResponse.json({ juzs: [] });
        }),
      );

      await testClient.content.v4.juzs.list({ mushaf: 6 });

      expect(requestUrl!.searchParams.get("mushaf")).toBe("6");
    });
  });
});
