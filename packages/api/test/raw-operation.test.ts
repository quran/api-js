import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { OperationDefinition } from "../src/generated/contracts";
import type { OperationDefinition as PublicOperationDefinition } from "../src/generated/public-contracts";
import { server } from "../mocks/server";
import { createPublicClient } from "../src/public";
import { QuranFetcher } from "../src/sdk/fetcher";
import { PublicQuranFetcher } from "../src/sdk/public-fetcher";
import { createServerClient } from "../src/server";

describe("raw operation requests", () => {
  it("replaces server raw operation path params before fetching", async () => {
    let chaptersUrl: string | null = null;

    server.use(
      http.post("http://localhost:5444/oauth2/token", () =>
        HttpResponse.json({
          access_token: "app-token",
          expires_in: 3600,
          scope: "content",
          token_type: "Bearer",
        }),
      ),
      http.get("http://localhost:3020/api/v4/chapters/1", ({ request }) => {
        chaptersUrl = request.url;
        expect(request.headers.get("x-auth-token")).toBe("app-token");

        return HttpResponse.json({
          chapter: { id: 1, name_simple: "Al-Fatihah" },
        });
      }),
    );

    const fetcher = new QuranFetcher("server", {
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        contentBaseUrl: "http://localhost:3020",
        tokenHost: "http://localhost:5444",
      },
    });
    const operation: OperationDefinition = {
      auth: "app",
      method: "get",
      operationName: "getChapter",
      path: "/chapters/{id}",
      service: "content",
      tags: [],
      version: "v4",
    };

    await fetcher.requestOperation(operation, {
      path: { id: 1 },
      query: { language: "en" },
    });

    expect(chaptersUrl).toBe(
      "http://localhost:3020/api/v4/chapters/1?language=en",
    );
  });

  it("uses server raw operation method when request method is absent", async () => {
    let requestMethod: string | null = null;

    server.use(
      http.post(
        "http://localhost:3020/api/v4/raw-action",
        async ({ request }) => {
          requestMethod = request.method;
          expect(await request.json()).toEqual({ name: "value" });

          return HttpResponse.json({ ok: true });
        },
      ),
    );

    const fetcher = new QuranFetcher("server", {
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        contentBaseUrl: "http://localhost:3020",
      },
    });
    const operation: OperationDefinition = {
      auth: "none",
      method: "post",
      operationName: "createRawAction",
      path: "/raw-action",
      service: "content",
      tags: [],
      version: "v4",
    };

    await fetcher.requestOperation(operation, {
      body: { name: "value" },
    });

    expect(requestMethod).toBe("POST");
  });

  it("does not treat verse keys as colon path templates", () => {
    const fetcher = new QuranFetcher("server", {
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        contentBaseUrl: "http://localhost:3020",
      },
    });

    expect(
      fetcher.buildServiceUrl("content", "/recitations/1/by_ayah/1:1"),
    ).toBe("http://localhost:3020/api/v4/recitations/1/by_ayah/1:1");
  });

  it("preserves server user-service query parameter casing", () => {
    const fetcher = new QuranFetcher("server", {
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
    });

    expect(
      fetcher.buildServiceUrl("auth", "/v1/bookmarks", {
        first: 5,
        mushafId: 1,
        sortBy: "recentlyAdded",
      }),
    ).toBe(
      "http://localhost:3001/v1/bookmarks?first=5&mushafId=1&sortBy=recentlyAdded",
    );
  });

  it("preserves server Quran Reflect query parameter casing", () => {
    const fetcher = new QuranFetcher("server", {
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        quranReflectBaseUrl: "http://localhost:3002",
      },
    });

    expect(
      fetcher.buildServiceUrl("quranReflect", "/v1/posts/feed", {
        postTypeIds: [1, 2],
        postingAsUserId: 123,
        sortBy: "recent",
      }),
    ).toBe(
      "http://localhost:3002/v1/posts/feed?postTypeIds=1%2C2&postingAsUserId=123&sortBy=recent",
    );
  });

  it("passes bookmark detail queries through the server auth wrapper", async () => {
    let bookmarkUrl: string | null = null;

    server.use(
      http.get("http://localhost:3001/v1/bookmarks/bookmark", ({ request }) => {
        bookmarkUrl = request.url;
        expect(request.headers.get("x-auth-token")).toBe("user-token");

        return HttpResponse.json({
          id: "bookmark-1",
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
      userSession: {
        accessToken: "user-token",
      },
    });

    await client.auth.bookmarks.get({
      isReading: false,
      key: 2,
      mushafId: 1,
      type: "ayah",
      verseNumber: 255,
    });

    expect(bookmarkUrl).toBe(
      "http://localhost:3001/v1/bookmarks/bookmark?isReading=false&key=2&mushafId=1&type=ayah&verseNumber=255",
    );
  });

  it("rejects legacy server bookmark id lookup calls", async () => {
    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
      userSession: {
        accessToken: "user-token",
      },
    });

    await expect(client.auth.bookmarks.get("bookmark-1")).rejects.toThrow(
      "auth.bookmarks.get(bookmarkId) is not supported",
    );
  });

  it("routes content-catalog gateway paths without the content prefix", async () => {
    let feedUrl: string | null = null;
    let commentsUrl: string | null = null;
    const requestedScopes: string[] = [];

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();
        const scope = new URLSearchParams(body).get("scope") ?? "";
        requestedScopes.push(scope);

        return HttpResponse.json({
          access_token: `${scope}-token`,
          expires_in: 3600,
          scope,
          token_type: "Bearer",
        });
      }),
      http.get(
        "http://localhost:3020/quran-reflect/v1/posts/feed",
        ({ request }) => {
          feedUrl = request.url;
          expect(request.headers.get("x-auth-token")).toBe("post.read-token");

          return HttpResponse.json({
            data: [],
          });
        },
      ),
      http.get(
        "http://localhost:3020/quran-reflect/v1/posts/123/comments",
        ({ request }) => {
          commentsUrl = request.url;
          expect(request.headers.get("x-auth-token")).toBe(
            "comment.read-token",
          );

          return HttpResponse.json({
            data: [],
          });
        },
      ),
    );

    const fetcher = new QuranFetcher("server", {
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        gatewayUrl: "http://localhost:3020",
        tokenHost: "http://localhost:5444",
      },
    });
    const feedOperation: OperationDefinition = {
      auth: "app",
      method: "get",
      operationName: "postsControllerFeed",
      path: "/quran-reflect/v1/posts/feed",
      service: "content",
      tags: [],
      version: "v4",
    };
    const commentsOperation: OperationDefinition = {
      auth: "app",
      method: "get",
      operationName: "postsControllerGetComments",
      path: "/quran-reflect/v1/posts/{id}/comments",
      service: "content",
      tags: [],
      version: "v4",
    };

    await fetcher.requestOperation(feedOperation);
    await fetcher.requestOperation(commentsOperation, { path: { id: 123 } });

    expect(feedUrl).toBe("http://localhost:3020/quran-reflect/v1/posts/feed");
    expect(commentsUrl).toBe(
      "http://localhost:3020/quran-reflect/v1/posts/123/comments",
    );
    expect(requestedScopes).toEqual(["post.read", "comment.read"]);
  });

  it("replaces public raw operation path params before fetching", async () => {
    let noteUrl: string | null = null;

    server.use(
      http.get("http://localhost:3001/v1/notes/note-1", ({ request }) => {
        noteUrl = request.url;
        expect(request.headers.get("x-auth-token")).toBe("user-token");

        return HttpResponse.json({
          data: { id: "note-1" },
        });
      }),
    );

    const fetcher = new PublicQuranFetcher({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
      userSession: {
        accessToken: "user-token",
      },
    });
    const operation: PublicOperationDefinition = {
      auth: "user",
      method: "get",
      operationName: "getNote",
      path: "/v1/notes/{noteId}",
      service: "auth",
      tags: [],
      version: "v1",
    };

    await fetcher.requestOperation(operation, {
      path: { noteId: "note-1" },
      query: { first: 5 },
    });

    expect(noteUrl).toBe("http://localhost:3001/v1/notes/note-1?first=5");
  });

  it("normalizes public colon path templates like server paths", () => {
    const fetcher = new PublicQuranFetcher({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
    });

    expect(fetcher.buildServiceUrl("auth", "/v1/notes/:noteId")).toBe(
      "http://localhost:3001/v1/notes/{noteId}",
    );
  });

  it("preserves public user-service query parameter casing", () => {
    const fetcher = new PublicQuranFetcher({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
    });

    expect(
      fetcher.buildServiceUrl("auth", "/v1/streaks", {
        first: 5,
        orderBy: "startDate",
        sortOrder: "desc",
      }),
    ).toBe(
      "http://localhost:3001/v1/streaks?first=5&orderBy=startDate&sortOrder=desc",
    );
  });

  it("preserves public Quran Reflect query parameter casing", () => {
    const fetcher = new PublicQuranFetcher({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        quranReflectBaseUrl: "http://localhost:3002",
      },
    });

    expect(
      fetcher.buildServiceUrl("quranReflect", "/v1/users/search", {
        postingAs: "user",
        postingAsUserId: 123,
        roomId: 456,
      }),
    ).toBe(
      "http://localhost:3002/v1/users/search?postingAs=user&postingAsUserId=123&roomId=456",
    );
  });

  it("passes bookmark detail queries through the public auth wrapper", async () => {
    let bookmarkUrl: string | null = null;

    server.use(
      http.get("http://localhost:3001/v1/bookmarks/bookmark", ({ request }) => {
        bookmarkUrl = request.url;
        expect(request.headers.get("x-auth-token")).toBe("user-token");

        return HttpResponse.json({
          id: "bookmark-1",
        });
      }),
    );

    const client = createPublicClient({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
      userSession: {
        accessToken: "user-token",
      },
    });

    await client.auth.bookmarks.get({
      isReading: true,
      mushafId: 1,
    });

    expect(bookmarkUrl).toBe(
      "http://localhost:3001/v1/bookmarks/bookmark?isReading=true&mushafId=1",
    );
  });

  it("rejects legacy public bookmark id lookup calls", async () => {
    const client = createPublicClient({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
      userSession: {
        accessToken: "user-token",
      },
    });

    await expect(client.auth.bookmarks.get("bookmark-1")).rejects.toThrow(
      "auth.bookmarks.get(bookmarkId) is not supported",
    );
  });

  it("uses public raw operation method when request method is absent", async () => {
    let requestMethod: string | null = null;

    server.use(
      http.delete("http://localhost:3001/v1/notes/note-1", ({ request }) => {
        requestMethod = request.method;

        return HttpResponse.json({ ok: true });
      }),
    );

    const fetcher = new PublicQuranFetcher({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
      },
      userSession: {
        accessToken: "user-token",
      },
    });
    const operation: PublicOperationDefinition = {
      auth: "user",
      method: "delete",
      operationName: "deleteNote",
      path: "/v1/notes/{noteId}",
      service: "auth",
      tags: [],
      version: "v1",
    };

    await fetcher.requestOperation(operation, {
      path: { noteId: "note-1" },
    });

    expect(requestMethod).toBe("DELETE");
  });
});
