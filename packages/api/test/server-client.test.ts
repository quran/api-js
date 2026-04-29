import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { Language, SearchMode } from "../src";
import { createServerClient } from "../src/server";

interface DataListResponse {
  data: Array<{ id: string }>;
}

describe("createServerClient", () => {
  it("uses the configured token host and direct service URLs", async () => {
    let tokenHostUrl: string | null = null;
    let chaptersUrl: string | null = null;
    let searchUrl: string | null = null;

    server.use(
      http.post("http://localhost:5444/oauth2/token", ({ request }) => {
        tokenHostUrl = request.url;
        return HttpResponse.json({
          access_token: "server-token",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "content search",
        });
      }),
      http.get("http://localhost:3020/api/v4/chapters", ({ request }) => {
        chaptersUrl = request.url;
        return HttpResponse.json({
          chapters: [{ id: 1, name_simple: "Al-Fatihah" }],
        });
      }),
      http.get("http://localhost:3002/v1/search", ({ request }) => {
        searchUrl = request.url;
        return HttpResponse.json({
          result: {
            navigation: [],
            verses: [],
          },
          pagination: {
            current_page: 1,
            next_page: null,
            per_page: 30,
            total_pages: 1,
            total_records: 0,
          },
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        tokenHost: "http://localhost:5444",
        contentBaseUrl: "http://localhost:3020",
        searchBaseUrl: "http://localhost:3002",
      },
    });

    const chapters = await client.content.v4.chapters.list();
    const search = await client.search.v1.query({
      query: "mercy",
      mode: SearchMode.Quick,
    });

    expect(tokenHostUrl).toBe("http://localhost:5444/oauth2/token");
    expect(chaptersUrl).toBe(
      "http://localhost:3020/api/v4/chapters?language=ar",
    );
    expect(searchUrl).toContain("http://localhost:3002/v1/search");
    expect(searchUrl).toContain("language=ar");
    expect(chapters[0]?.id).toBe(1);
    expect(search.pagination.currentPage).toBe(1);
  });

  it("lets server client defaults override the Arabic language default", async () => {
    let chaptersUrl: string | null = null;

    server.use(
      http.get("http://localhost:3020/api/v4/chapters", ({ request }) => {
        chaptersUrl = request.url;
        return HttpResponse.json({
          chapters: [{ id: 1, name_simple: "Al-Fatihah" }],
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      defaults: {
        language: Language.ENGLISH,
      },
      services: {
        contentBaseUrl: "http://localhost:3020",
      },
    });

    await client.content.v4.chapters.list();

    expect(chaptersUrl).toBe(
      "http://localhost:3020/api/v4/chapters?language=en",
    );
  });

  it("stores a complete user session after code exchange and refresh", async () => {
    let storedSession: Record<string, unknown> | null = null;

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();

        if (body.includes("grant_type=authorization_code")) {
          return HttpResponse.json({
            access_token: "access-token-1",
            expires_in: 3600,
            id_token: "id-token-1",
            refresh_token: "refresh-token-1",
            scope: "openid offline_access user",
            token_type: "bearer",
          });
        }

        return HttpResponse.json({
          access_token: "access-token-2",
          expires_in: 3600,
          id_token: "id-token-2",
          scope: "openid offline_access user",
          token_type: "bearer",
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    await client.oauth2.v1.exchangeCode({
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: "http://localhost:3000/callback",
    });

    expect(storedSession).toMatchObject({
      accessToken: "access-token-1",
      idToken: "id-token-1",
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user",
      tokenType: "bearer",
    });
    expect(typeof storedSession?.expiresAt).toBe("number");

    await client.oauth2.v1.refresh();

    expect(storedSession).toMatchObject({
      accessToken: "access-token-2",
      idToken: "id-token-2",
      refreshToken: "refresh-token-1",
    });
  });

  it("preserves an explicit refresh token when the token response omits one", async () => {
    let storedSession: Record<string, unknown> | null = null;
    let refreshBody = "";

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        refreshBody = await request.text();

        return HttpResponse.json({
          access_token: "access-token-2",
          expires_in: 3600,
          id_token: "id-token-2",
          scope: "openid offline_access user",
          token_type: "bearer",
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    await client.oauth2.v1.refresh("explicit-refresh-token");

    expect(refreshBody).toContain("refresh_token=explicit-refresh-token");
    expect(storedSession).toMatchObject({
      accessToken: "access-token-2",
      idToken: "id-token-2",
      refreshToken: "explicit-refresh-token",
    });
  });

  it("keeps exchanged user sessions in memory when storage is absent", async () => {
    server.use(
      http.post("http://localhost:5444/oauth2/token", () =>
        HttpResponse.json({
          access_token: "access-token-1",
          expires_in: 3600,
          id_token: "id-token-1",
          refresh_token: "refresh-token-1",
          scope: "openid offline_access user",
          token_type: "bearer",
        }),
      ),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        oauth2BaseUrl: "http://localhost:5444",
      },
    });

    await client.oauth2.v1.exchangeCode({
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri: "http://localhost:3000/callback",
    });

    await expect(client.getUserSession()).resolves.toMatchObject({
      accessToken: "access-token-1",
      idToken: "id-token-1",
      refreshToken: "refresh-token-1",
    });
  });

  it("keeps the previous in-memory user session when storage writes fail", async () => {
    server.use(
      http.post("http://localhost:5444/oauth2/token", () =>
        HttpResponse.json({
          access_token: "access-token-1",
          expires_in: 3600,
          refresh_token: "refresh-token-1",
          token_type: "bearer",
        }),
      ),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        setSession: () => {
          throw new Error("storage write failed");
        },
      },
      userSession: {
        accessToken: "bootstrap-token",
      },
    });

    await expect(
      client.oauth2.v1.exchangeCode({
        code: "auth-code",
        redirectUri: "http://localhost:3000/callback",
      }),
    ).rejects.toThrowError(/storage write failed/i);
    await expect(client.getUserSession()).resolves.toMatchObject({
      accessToken: "bootstrap-token",
    });
  });

  it("treats null storage sessions as logged out instead of falling back", async () => {
    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      storage: {
        getSession: () => null,
      },
      userSession: {
        accessToken: "bootstrap-token",
      },
    });

    await expect(client.getUserSession()).resolves.toBeNull();
    await expect(client.auth.v1.notes.list()).rejects.toThrowError(
      /requires a user session/i,
    );
  });

  it("refreshes a near-expiry user session before user-authenticated requests", async () => {
    let refreshRequests = 0;
    let notesToken: string | null = null;
    let storedSession: Record<string, unknown> | null = {
      accessToken: "stale-access-token",
      expiresAt: Date.now() + 1_000,
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user note",
      tokenType: "bearer",
    };

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();

        expect(body).toContain("grant_type=refresh_token");
        expect(body).toContain("refresh_token=refresh-token-1");
        refreshRequests += 1;

        return HttpResponse.json({
          access_token: "fresh-access-token",
          expires_in: 3600,
          refresh_token: "refresh-token-2",
          scope: "openid offline_access user note",
          token_type: "bearer",
        });
      }),
      http.get("http://localhost:3001/v1/notes", ({ request }) => {
        notesToken = request.headers.get("x-auth-token");

        return HttpResponse.json({
          data: [{ id: "note-1" }],
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    const response = (await client.auth.v1.notes.list()) as DataListResponse;

    expect(refreshRequests).toBe(1);
    expect(notesToken).toBe("fresh-access-token");
    expect(response.data[0]?.id).toBe("note-1");
    expect(storedSession).toMatchObject({
      accessToken: "fresh-access-token",
      refreshToken: "refresh-token-2",
    });
  });

  it("deduplicates a near-expiry refresh across concurrent user requests", async () => {
    let notesRequests = 0;
    let refreshRequests = 0;
    let storedSession: Record<string, unknown> | null = {
      accessToken: "stale-access-token",
      expiresAt: Date.now() + 1_000,
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user note",
      tokenType: "bearer",
    };

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();

        expect(body).toContain("grant_type=refresh_token");
        refreshRequests += 1;

        return HttpResponse.json({
          access_token: "fresh-access-token",
          expires_in: 3600,
          refresh_token: "refresh-token-2",
          scope: "openid offline_access user note",
          token_type: "bearer",
        });
      }),
      http.get("http://localhost:3001/v1/notes", ({ request }) => {
        notesRequests += 1;
        expect(request.headers.get("x-auth-token")).toBe("fresh-access-token");

        return HttpResponse.json({
          data: [{ id: `note-${notesRequests}` }],
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    const [firstResponse, secondResponse] = (await Promise.all([
      client.auth.v1.notes.list(),
      client.auth.v1.notes.list(),
    ])) as [DataListResponse, DataListResponse];

    expect(refreshRequests).toBe(1);
    expect(notesRequests).toBe(2);
    expect(firstResponse.data[0]?.id).toBe("note-1");
    expect(secondResponse.data[0]?.id).toBe("note-2");
    expect(storedSession).toMatchObject({
      accessToken: "fresh-access-token",
      refreshToken: "refresh-token-2",
    });
  });

  it("refreshes once after a 401 for user-authenticated requests", async () => {
    let notesRequests = 0;
    let refreshRequests = 0;
    let storedSession: Record<string, unknown> | null = {
      accessToken: "expired-access-token",
      expiresAt: Date.now() + 3_600_000,
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user note",
      tokenType: "bearer",
    };

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();

        expect(body).toContain("grant_type=refresh_token");
        refreshRequests += 1;

        return HttpResponse.json({
          access_token: "replayed-access-token",
          expires_in: 3600,
          refresh_token: "refresh-token-2",
          scope: "openid offline_access user note",
          token_type: "bearer",
        });
      }),
      http.get("http://localhost:3001/v1/notes", ({ request }) => {
        notesRequests += 1;

        if (notesRequests === 1) {
          expect(request.headers.get("x-auth-token")).toBe(
            "expired-access-token",
          );
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        expect(request.headers.get("x-auth-token")).toBe(
          "replayed-access-token",
        );
        return HttpResponse.json({
          data: [{ id: "note-2" }],
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    const response = (await client.auth.v1.notes.list()) as DataListResponse;

    expect(refreshRequests).toBe(1);
    expect(notesRequests).toBe(2);
    expect(response.data[0]?.id).toBe("note-2");
    expect(storedSession).toMatchObject({
      accessToken: "replayed-access-token",
      refreshToken: "refresh-token-2",
    });
  });

  it("deduplicates a 401-triggered refresh across concurrent user requests", async () => {
    let expiredTokenRequests = 0;
    let refreshedTokenRequests = 0;
    let refreshRequests = 0;
    let storedSession: Record<string, unknown> | null = {
      accessToken: "expired-access-token",
      expiresAt: Date.now() + 3_600_000,
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user note",
      tokenType: "bearer",
    };

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();

        expect(body).toContain("grant_type=refresh_token");
        refreshRequests += 1;

        return HttpResponse.json({
          access_token: "replayed-access-token",
          expires_in: 3600,
          refresh_token: "refresh-token-2",
          scope: "openid offline_access user note",
          token_type: "bearer",
        });
      }),
      http.get("http://localhost:3001/v1/notes", ({ request }) => {
        const accessToken = request.headers.get("x-auth-token");

        if (accessToken === "expired-access-token") {
          expiredTokenRequests += 1;
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        expect(accessToken).toBe("replayed-access-token");
        refreshedTokenRequests += 1;
        return HttpResponse.json({
          data: [{ id: `note-${refreshedTokenRequests}` }],
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    const [firstResponse, secondResponse] = (await Promise.all([
      client.auth.v1.notes.list(),
      client.auth.v1.notes.list(),
    ])) as [DataListResponse, DataListResponse];

    expect(refreshRequests).toBe(1);
    expect(expiredTokenRequests).toBe(2);
    expect(refreshedTokenRequests).toBe(2);
    expect(firstResponse.data[0]?.id).toBe("note-1");
    expect(secondResponse.data[0]?.id).toBe("note-2");
    expect(storedSession).toMatchObject({
      accessToken: "replayed-access-token",
      refreshToken: "refresh-token-2",
    });
  });

  it("clears the stored session when automatic refresh is rejected", async () => {
    let storedSession: Record<string, unknown> | null = {
      accessToken: "expired-access-token",
      expiresAt: Date.now() + 1_000,
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user note",
      tokenType: "bearer",
    };

    server.use(
      http.post("http://localhost:5444/oauth2/token", () =>
        HttpResponse.json({ error: "invalid_grant" }, { status: 401 }),
      ),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        authBaseUrl: "http://localhost:3001",
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    await expect(client.auth.v1.notes.list()).rejects.toThrowError(
      /session expired|sign in again/i,
    );
    expect(storedSession).toBeNull();
  });

  it("keeps content app-authenticated calls independent from user-session refresh", async () => {
    const tokenGrantTypes: string[] = [];
    let storedSession: Record<string, unknown> | null = {
      accessToken: "expired-user-access-token",
      expiresAt: Date.now() + 1_000,
      refreshToken: "refresh-token-1",
      scope: "openid offline_access user note",
      tokenType: "bearer",
    };

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);

        tokenGrantTypes.push(params.get("grant_type") ?? "missing");

        return HttpResponse.json({
          access_token: "content-access-token",
          expires_in: 3600,
          scope: "content",
          token_type: "bearer",
        });
      }),
      http.get("http://localhost:3020/api/v4/chapters", ({ request }) => {
        expect(request.headers.get("x-auth-token")).toBe(
          "content-access-token",
        );
        return HttpResponse.json({
          chapters: [{ id: 1, name_simple: "Al-Fatihah" }],
        });
      }),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        contentBaseUrl: "http://localhost:3020",
        oauth2BaseUrl: "http://localhost:5444",
      },
      storage: {
        getSession: () => storedSession as never,
        setSession: (session) => {
          storedSession = session as Record<string, unknown> | null;
        },
      },
    });

    const chapters = await client.content.v4.chapters.list();

    expect(chapters[0]?.id).toBe(1);
    expect(tokenGrantTypes).toEqual(["client_credentials"]);
    expect(storedSession).toMatchObject({
      accessToken: "expired-user-access-token",
      refreshToken: "refresh-token-1",
    });
  });
});
