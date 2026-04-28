import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { Language, QuranClient, SearchMode } from "../src";

describe("QuranClient legacy compatibility", () => {
  it("keeps the root QuranClient export and legacy gateway routes working", async () => {
    let chaptersUrl: string | null = null;
    let searchUrl: string | null = null;
    let tokenRequests = 0;

    server.use(
      http.post("http://localhost:5444/oauth2/token", () => {
        tokenRequests += 1;

        return HttpResponse.json({
          access_token: "legacy-token",
          expires_in: 3600,
          scope: "content",
          token_type: "Bearer",
        });
      }),
      http.get("http://localhost:3020/content/api/v4/chapters", ({ request }) => {
        chaptersUrl = request.url;
        expect(request.headers.get("x-auth-token")).toBe("legacy-token");
        expect(request.headers.get("x-client-id")).toBe("client-id");

        return HttpResponse.json({
          chapters: [{ id: 1, name_simple: "Al-Fatihah" }],
        });
      }),
      http.get("http://localhost:3020/v1/search", ({ request }) => {
        searchUrl = request.url;
        expect(request.headers.get("x-auth-token")).toBe("legacy-token");

        return HttpResponse.json({
          pagination: {
            current_page: 1,
            next_page: null,
            per_page: 30,
            total_pages: 1,
            total_records: 0,
          },
          result: {
            navigation: [],
            verses: [],
          },
        });
      }),
    );

    const client = new QuranClient({
      authBaseUrl: "http://localhost:5444",
      clientId: "client-id",
      clientSecret: "client-secret",
      contentBaseUrl: "http://localhost:3020",
    });

    await expect(client.chapters.findAll()).resolves.toEqual([
      { id: 1, nameSimple: "Al-Fatihah" },
    ]);
    await client.search.search("mercy", { mode: SearchMode.Quick });

    expect(chaptersUrl).toBe(
      "http://localhost:3020/content/api/v4/chapters?language=ar",
    );
    expect(searchUrl).toContain("http://localhost:3020/v1/search?");
    expect(searchUrl).toContain("language=ar");
    expect(searchUrl).toContain("query=mercy");
    expect(searchUrl).toContain("size=30");
    expect(tokenRequests).toBe(1);
  });

  it("preserves legacy config access and updates", () => {
    const client = new QuranClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      defaults: {
        language: Language.ENGLISH,
      },
    });

    expect(client.getConfig()).toMatchObject({
      authBaseUrl: "https://oauth2.quran.foundation",
      clientId: "client-id",
      contentBaseUrl: "https://apis.quran.foundation",
      defaults: {
        language: Language.ENGLISH,
      },
    });

    client.updateConfig({
      defaults: {
        perPage: 5,
      },
    });

    expect(client.getConfig().defaults).toMatchObject({
      language: Language.ENGLISH,
      perPage: 5,
    });
  });
});
