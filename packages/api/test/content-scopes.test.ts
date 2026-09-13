import { beforeEach, describe, expect, it, vi } from "vitest";

import { operationCatalog } from "@/generated/contracts";
import { QuranFetcher } from "@/sdk/fetcher";
import type { ServerClientConfig } from "@/types";

/**
 * T10 acceptance tests for route-aware token acquisition.
 *
 * The behavior that matters is which scopes leave the SDK in a client-credentials request, so
 * these tests drive a real QuranFetcher with a fake fetch and assert on the token requests it
 * makes: legacy mode must be unchanged, granular mode must ask for the operation's own scope,
 * and neither may reach for a broader permission when a call is refused.
 */

const TOKEN_URL = "https://oauth2.quran.foundation/oauth2/token";

type Recorded = {
  url: string;
  /** Form-encoded request body, parsed. The SDK only ever posts URLSearchParams here. */
  body: URLSearchParams;
};

/** Narrow the fetch body union to the form encoding the token endpoint actually receives. */
const parseFormBody = (body: RequestInit["body"]): URLSearchParams => {
  if (body instanceof URLSearchParams) return body;
  if (typeof body === "string") return new URLSearchParams(body);
  return new URLSearchParams();
};

const asHref = (url: string | URL | Request): string => {
  if (typeof url === "string") return url;
  if (url instanceof URL) return url.href;
  return url.url;
};

const contentOperation = (name: string) => {
  const operation = operationCatalog.content.v4.operations[name];
  if (!operation) throw new Error(`no such content operation: ${name}`);
  return {
    ...operation,
    operationName: name,
    service: "content" as const,
    tags: [],
    version: "v4",
  };
};

/** Fake fetch that hands out tokens and empty JSON bodies, recording every call. */
const makeFetch = (
  options: { grantedScope?: string; apiStatus?: number; tokenError?: string } = {},
) => {
  const calls: Recorded[] = [];

  const fetchImpl = vi.fn((url: string | URL | Request, init?: RequestInit) => {
    const href = asHref(url);
    const body = parseFormBody(init?.body);
    calls.push({ body, url: href });

    if (href === TOKEN_URL) {
      const requested = body.get("scope") ?? "";
      if (options.tokenError) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: options.tokenError }), {
            headers: { "content-type": "application/json" },
            status: 400,
          }),
        );
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            access_token: `token-for-${requested}`,
            expires_in: 3600,
            scope: options.grantedScope ?? requested,
            token_type: "Bearer",
          }),
          { headers: { "content-type": "application/json" }, status: 200 },
        ),
      );
    }

    return Promise.resolve(
      new Response(JSON.stringify({}), {
        headers: { "content-type": "application/json" },
        status: options.apiStatus ?? 200,
      }),
    );
  });

  const tokenScopes = () =>
    calls
      .filter((call) => call.url === TOKEN_URL)
      .map((call) => call.body.get("scope"));

  return { calls, fetchImpl, tokenScopes };
};

const serverConfig = (
  overrides: Partial<ServerClientConfig> = {},
  fetchImpl?: typeof fetch,
): ServerClientConfig => ({
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
  fetch: fetchImpl,
  ...overrides,
});

describe("legacy mode is the default and is unchanged", () => {
  it("requests the content umbrella for a content operation", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher("server", serverConfig({}, fetchImpl as never));

    await fetcher.requestOperation(contentOperation("listChapters"));

    expect(tokenScopes()).toEqual(["content"]);
  });

  it("keeps the special handling of the public QuranReflect reads", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher("server", serverConfig({}, fetchImpl as never));

    const feed = Object.entries(operationCatalog.content.v4.operations).find(
      ([, operation]) => operation.path === "/quran-reflect/v1/posts/feed",
    );
    const comments = Object.entries(operationCatalog.content.v4.operations).find(
      ([, operation]) => operation.path === "/quran-reflect/v1/posts/{id}/comments",
    );
    expect(feed).toBeDefined();
    expect(comments).toBeDefined();

    await fetcher.requestOperation(contentOperation(feed![0]));
    await fetcher.requestOperation(contentOperation(comments![0]), { path: { id: "1" } });

    expect(tokenScopes()).toEqual(["post.read", "comment.read"]);
  });

  it("still works through the untyped legacy fetch facade", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher("server", serverConfig({}, fetchImpl as never));

    await fetcher.fetch("/api/v4/chapters");

    // The facade has no operation, so legacy mode falls back to the service scope as before.
    expect(tokenScopes()).toEqual(["content"]);
  });
});

describe("granular mode requests the operation's own scope", () => {
  const granular = (overrides: Partial<ServerClientConfig> = {}, fetchImpl?: typeof fetch) =>
    new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular", ...overrides }, fetchImpl),
    );

  it.each([
    ["listChapters", "content.quran.read"],
    ["recitations", "content.audio.read"],
    ["translations", "content.translations.read"],
    ["tafsirs", "content.tafsirs.read"],
    ["languages", "content.metadata.read"],
    ["hadithCountWithinRange", "content.hadith.read"],
    ["resourcesSync", "content.sync.read"],
    ["countAnswersWithinRange", "content.answers.read"],
  ])("asks for %s -> %s", async (operationName, expectedScope) => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = granular({}, fetchImpl as never);

    await fetcher.requestOperation(contentOperation(operationName));

    expect(tokenScopes()).toEqual([expectedScope]);
  });

  it("asks for the reflection successor on the public QuranReflect reads", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = granular({}, fetchImpl as never);

    const comments = Object.entries(operationCatalog.content.v4.operations).find(
      ([, operation]) => operation.path === "/quran-reflect/v1/posts/{id}/comments",
    );
    await fetcher.requestOperation(contentOperation(comments![0]), { path: { id: "1" } });

    // Not comment.read: the successor replaces the path-sniffing special case entirely.
    expect(tokenScopes()).toEqual(["content.reflections.read"]);
  });

  it("never requests the legacy umbrella", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = granular({}, fetchImpl as never);

    for (const name of ["listChapters", "recitations", "tafsirs"]) {
      await fetcher.requestOperation(contentOperation(name));
    }

    for (const scope of tokenScopes()) {
      expect(scope).not.toBe("content");
      expect(scope).not.toBe("content.read");
    }
  });

  it("resolves an untyped fetch through the pinned contract", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = granular({}, fetchImpl as never);

    // No operation descriptor here, so the scope comes from a path lookup against the contract.
    // This is what the typed convenience facades rely on: they all call fetch() with a plain URL.
    await fetcher.fetch("/api/v4/chapters");

    expect(tokenScopes()).toEqual(["content.quran.read"]);
  });

  it("still refuses to guess for a path the contract does not cover", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = granular({}, fetchImpl as never);

    // resources/changes is deliberately left unassigned, so there is no scope to resolve.
    // Falling back to `content` would defeat granular mode and would fail anyway for
    // credentials never granted it.
    await expect(fetcher.fetch("/api/v4/resources/changes")).rejects.toThrow(
      /no content scope is known/iu,
    );
    expect(tokenScopes()).toEqual([]);
  });
});

describe("unrelated permissions are never requested for a content call", () => {
  it.each(["legacy", "granular"] as const)("does not request search in %s mode", async (mode) => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: mode }, fetchImpl as never),
    );

    await fetcher.requestOperation(contentOperation("listChapters"));

    for (const scope of tokenScopes()) {
      expect(scope).not.toContain("search");
      expect(scope).not.toContain("analytics");
      expect(scope).not.toContain("qiraat");
    }
  });

  it("keeps requesting the search scope for a search call in granular mode", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await fetcher.request("search", "/search");

    expect(tokenScopes()).toEqual(["search"]);
  });
});

describe("token cache keys", () => {
  it("reuses one token for repeated calls needing the same scope", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await fetcher.requestOperation(contentOperation("listChapters"));
    await fetcher.requestOperation(contentOperation("listJuzs"));

    // Both are content.quran.read, so only one token exchange should happen.
    expect(tokenScopes()).toEqual(["content.quran.read"]);
  });

  it("keeps separate tokens for different scopes", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await fetcher.requestOperation(contentOperation("listChapters"));
    await fetcher.requestOperation(contentOperation("recitations"));

    expect(tokenScopes()).toEqual(["content.quran.read", "content.audio.read"]);
  });

  it("shares a single token request across concurrent calls", async () => {
    const { fetchImpl, tokenScopes } = makeFetch();
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await Promise.all([
      fetcher.requestOperation(contentOperation("listChapters")),
      fetcher.requestOperation(contentOperation("listChapters")),
      fetcher.requestOperation(contentOperation("listJuzs")),
    ]);

    expect(tokenScopes()).toEqual(["content.quran.read"]);
  });

  it("does not let an in-flight request restore a cleared token", async () => {
    let releaseFirstToken!: () => void;
    let markFirstTokenStarted!: () => void;
    const firstTokenGate = new Promise<void>((resolve) => {
      releaseFirstToken = resolve;
    });
    const firstTokenStarted = new Promise<void>((resolve) => {
      markFirstTokenStarted = resolve;
    });
    let tokenRequests = 0;
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (asHref(url) === TOKEN_URL) {
        tokenRequests += 1;
        if (tokenRequests === 1) {
          markFirstTokenStarted();
          await firstTokenGate;
        }
        const scope = parseFormBody(init?.body).get("scope") ?? "";
        return new Response(
          JSON.stringify({
            access_token: `token-${tokenRequests}`,
            expires_in: 3600,
            scope,
            token_type: "Bearer",
          }),
          { headers: { "content-type": "application/json" }, status: 200 },
        );
      }

      return new Response(JSON.stringify({}), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    });
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    const firstCall = fetcher.requestOperation(contentOperation("listChapters"));
    await firstTokenStarted;
    fetcher.clearCachedTokens();
    releaseFirstToken();
    await firstCall;
    await fetcher.requestOperation(contentOperation("listChapters"));

    expect(tokenRequests).toBe(2);
  });

  it("isolates the cache by issuer, so one issuer's token is not reused at another", async () => {
    const { fetchImpl, calls } = makeFetch();
    const first = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );
    await first.requestOperation(contentOperation("listChapters"));

    const second = new QuranFetcher(
      "server",
      serverConfig(
        {
          contentScopeMode: "granular",
          services: { tokenHost: "https://oauth2-prelive.quran.foundation" },
        },
        fetchImpl as never,
      ),
    );
    await second.requestOperation(contentOperation("listChapters"));

    const tokenHosts = calls
      .filter((call) => call.url.endsWith("/oauth2/token"))
      .map((call) => new URL(call.url).host);
    expect(tokenHosts).toEqual([
      "oauth2.quran.foundation",
      "oauth2-prelive.quran.foundation",
    ]);
  });
});

describe("failures are reported, never widened", () => {
  it("does not retry a 403 with a broader scope", async () => {
    const { fetchImpl, tokenScopes } = makeFetch({ apiStatus: 403 });
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await expect(
      fetcher.requestOperation(contentOperation("listChapters")),
    ).rejects.toThrow(/did not carry a scope this endpoint accepts/iu);

    // Exactly one token request, for the granular scope. No fallback to `content`.
    expect(tokenScopes()).toEqual(["content.quran.read"]);
  });

  it("names the requested scope and the mode switch in the error", async () => {
    const { fetchImpl } = makeFetch({ apiStatus: 403 });
    const fetcher = new QuranFetcher("server", serverConfig({}, fetchImpl as never));

    await expect(
      fetcher.requestOperation(contentOperation("listChapters")),
    ).rejects.toThrow(/contentScopeMode: "granular"/u);
  });

  it("fails when the granted token shares no scope with the request", async () => {
    const { fetchImpl } = makeFetch({ grantedScope: "search" });
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await expect(
      fetcher.requestOperation(contentOperation("listChapters")),
    ).rejects.toThrow(/none of the requested scopes/iu);
  });

  it("does not suggest a content mode for a non-content invalid_scope", async () => {
    const { fetchImpl } = makeFetch({ tokenError: "invalid_scope" });
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "legacy" }, fetchImpl as never),
    );

    const failure = await fetcher.request("search", "/search").then(
      () => null,
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain('invalid_scope for "search"');
    expect((failure as Error).message).not.toContain("contentScopeMode");
  });

  it("accepts a legitimately narrowed grant", async () => {
    // RFC 6749 section 3.3 permits a narrower grant than requested. As long as the token carries
    // something we asked for, the call proceeds.
    const { fetchImpl } = makeFetch({ grantedScope: "content.quran.read" });
    const fetcher = new QuranFetcher(
      "server",
      serverConfig({ contentScopeMode: "granular" }, fetchImpl as never),
    );

    await expect(
      fetcher.requestOperation(contentOperation("listChapters")),
    ).resolves.toBeDefined();
  });
});

describe("catalog scope metadata", () => {
  it("covers every content operation with exactly one successor", () => {
    const operations = Object.entries(operationCatalog.content.v4.operations);
    expect(operations).toHaveLength(95);

    for (const [name, operation] of operations) {
      expect(operation.scopes, `${name} has no scope metadata`).toBeDefined();
      expect(operation.scopes?.granularAnyOf, name).toHaveLength(1);
      expect(operation.scopes?.legacyAnyOf.length, name).toBeGreaterThan(0);
      expect(operation.scopes?.contractVersion).toBe("content-scopes/v1");
    }
  });

  it("carries no quota information into the SDK", () => {
    for (const operation of Object.values(operationCatalog.content.v4.operations)) {
      expect(operation.scopes).not.toHaveProperty("quotaBuckets");
      expect(operation.scopes).not.toHaveProperty("rateLimitPolicyId");
    }
  });

  it("leaves non-content services without content scope metadata", () => {
    for (const operation of Object.values(operationCatalog.search.v1.operations)) {
      expect(operation.scopes).toBeUndefined();
    }
    for (const operation of Object.values(operationCatalog.auth.v1.operations)) {
      expect(operation.scopes).toBeUndefined();
    }
  });
});

describe("public browser clients keep their separation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses app-authenticated content calls in public mode, in both modes", async () => {
    for (const mode of ["legacy", "granular"] as const) {
      const { fetchImpl, tokenScopes } = makeFetch();
      const fetcher = new QuranFetcher("public", {
        clientId: "public-client",
        clientType: "public",
        contentScopeMode: mode,
        fetch: fetchImpl as never,
      });

      await expect(
        fetcher.requestOperation(contentOperation("listChapters")),
      ).rejects.toThrow(/server/iu);
      // No secret, so no token exchange may be attempted.
      expect(tokenScopes()).toEqual([]);
    }
  });
});
