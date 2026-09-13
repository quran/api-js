import { describe, expect, it, vi } from "vitest";

import { createServerClient } from "@/server";

/**
 * Granular mode through the **public** API surface.
 *
 * The tests in content-scopes.test.ts drive the internal fetcher's requestOperation(), which
 * always carries an operation descriptor. That missed a real defect: the typed convenience
 * facades (client.content.v4.chapters.list() and friends) call fetcher.fetch() with a plain URL
 * and no descriptor, so granular mode threw on the documented public API while the raw operation
 * API worked fine.
 *
 * These tests therefore instantiate createServerClient and call its actual public methods.
 */

const TOKEN_URL = "https://oauth2.quran.foundation/oauth2/token";

const makeFetch = () => {
  const scopes: string[] = [];

  const fetchImpl = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const href =
      typeof url === "string" ? url : url instanceof URL ? url.href : url.url;

    if (href.startsWith(TOKEN_URL)) {
      const body =
        init?.body instanceof URLSearchParams
          ? init.body
          : new URLSearchParams(typeof init?.body === "string" ? init.body : "");
      const requested = body.get("scope") ?? "";
      scopes.push(requested);

      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: "granular-token",
            expires_in: 3600,
            scope: requested,
            token_type: "Bearer",
          }),
          { headers: { "content-type": "application/json" }, status: 200 },
        ),
      );
    }

    // Every content response the facades unwrap, in one permissive body.
    return Promise.resolve(
      new Response(
        JSON.stringify({
          answers: [],
          audio_files: [],
          chapter: {},
          chapter_info: {},
          chapters: [],
          hadiths: [],
          juz: {},
          juzs: [],
          languages: [],
          recitations: [],
          resource: {},
          tafsirs: [],
          translations: [],
          verse: {},
          verses: [],
        }),
        { headers: { "content-type": "application/json" }, status: 200 },
      ),
    );
  });

  return { fetchImpl, scopes };
};

const granularClient = (fetchImpl: typeof fetch) =>
  createServerClient({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    contentScopeMode: "granular",
    fetch: fetchImpl,
  });

const legacyClient = (fetchImpl: typeof fetch) =>
  createServerClient({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    fetch: fetchImpl,
  });

/** Public entrypoints, one per granular content scope the reviewer asked to see covered. */
const publicCalls: Array<[string, (client: ReturnType<typeof granularClient>) => Promise<unknown>, string]> = [
  ["chapters.findAll", (c) => c.chapters.findAll(), "content.quran.read"],
  ["chapters.findById", (c) => c.chapters.findById("1"), "content.quran.read"],
  ["verses.findByChapter", (c) => c.verses.findByChapter("1"), "content.quran.read"],
  ["verses.findByKey", (c) => c.verses.findByKey("1:1"), "content.quran.read"],
  ["juzs.findAll", (c) => c.juzs.findAll(), "content.quran.read"],
  ["audio.findAllChapterRecitations", (c) => c.audio.findAllChapterRecitations("7"), "content.audio.read"],
  ["resources.findAllTranslations", (c) => c.resources.findAllTranslations(), "content.translations.read"],
  ["resources.findAllTafsirs", (c) => c.resources.findAllTafsirs(), "content.tafsirs.read"],
  ["resources.findAllLanguages", (c) => c.resources.findAllLanguages(), "content.metadata.read"],
  ["answers.findByAyah", (c) => c.answers.findByAyah("1:1"), "content.answers.read"],
  ["hadithReferences.findByAyah", (c) => c.hadithReferences.findByAyah("1:1"), "content.hadith.read"],
];

describe("granular mode works through the public typed API", () => {
  it.each(publicCalls)(
    "%s requests %s",
    async (_name, call, expectedScope) => {
      const { fetchImpl, scopes } = makeFetch();
      const client = granularClient(fetchImpl as never);

      await call(client);

      expect(scopes).toEqual([expectedScope]);
    },
  );

  it("never falls back to the legacy umbrella on any public call", async () => {
    const { fetchImpl, scopes } = makeFetch();
    const client = granularClient(fetchImpl as never);

    for (const [, call] of publicCalls) {
      await call(client);
    }

    expect(scopes.length).toBeGreaterThan(0);
    for (const scope of scopes) {
      expect(scope).not.toBe("content");
      expect(scope).not.toBe("content.read");
      expect(scope).not.toContain("search");
    }
  });

  it("resolves the same scope whichever entrypoint is used", async () => {
    // Three documented ways to list chapters: the top-level facade, the versioned content facade,
    // and the generated raw operation. The raw path carries a descriptor; the other two do not,
    // and used to throw. All three must now agree.
    const viaTop = makeFetch();
    await granularClient(viaTop.fetchImpl as never).chapters.findAll();

    const viaContent = makeFetch();
    await granularClient(viaContent.fetchImpl as never).content.v4.chapters.list();

    const viaRaw = makeFetch();
    await granularClient(viaRaw.fetchImpl as never).content.v4.raw.listChapters();

    expect(viaTop.scopes).toEqual(["content.quran.read"]);
    expect(viaContent.scopes).toEqual(viaTop.scopes);
    expect(viaRaw.scopes).toEqual(viaTop.scopes);
  });

  it("still requests the search scope for a search call", async () => {
    const { fetchImpl, scopes } = makeFetch();
    const client = granularClient(fetchImpl as never);

    await client.search.search({ query: "mercy" });

    expect(scopes).toEqual(["search"]);
  });
});

describe("legacy mode through the public API is unchanged", () => {
  it.each(publicCalls)("%s still requests content", async (_name, call) => {
    const { fetchImpl, scopes } = makeFetch();
    const client = legacyClient(fetchImpl as never);

    await call(client as never);

    expect(scopes).toEqual(["content"]);
  });
});

describe("path resolution is specific, not greedy", () => {
  it("does not resolve a longer path through a shorter template", async () => {
    // /chapters/{id}/info must not be served by /chapters/{id}, and both are content.quran.read
    // so a mistake here would be invisible without asserting the resolved path.
    const { fetchImpl, scopes } = makeFetch();
    const client = granularClient(fetchImpl as never);

    await client.chapters.findInfoById("1");

    expect(scopes).toEqual(["content.quran.read"]);
  });

  it("distinguishes sibling resource families on adjacent paths", async () => {
    const { fetchImpl, scopes } = makeFetch();
    const client = granularClient(fetchImpl as never);

    await client.resources.findAllTranslations();
    await client.resources.findAllTafsirs();
    await client.resources.findAllLanguages();

    expect(scopes).toEqual([
      "content.translations.read",
      "content.tafsirs.read",
      "content.metadata.read",
    ]);
  });
});
