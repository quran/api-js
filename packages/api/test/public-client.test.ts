import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { createPublicClient } from "../src/public";

interface CollectionListResponse {
  success: boolean;
  data: Array<{ id: string; name: string }>;
}

describe("createPublicClient", () => {
  it("rejects secret-bearing configuration", () => {
    expect(() =>
      createPublicClient({
        clientId: "client-id",
        clientType: "confidential-proxy",
        // @ts-expect-error - runtime guard should reject this too
        clientSecret: "should-not-be-here",
      }),
    ).toThrowError(/client_secret.*server/i);
  });

  it("blocks content access and allows user-session auth calls", async () => {
    server.use(
      http.get("http://localhost:3001/v1/collections", ({ request }) => {
        expect(request.headers.get("x-auth-token")).toBe("user-access-token");
        expect(request.headers.get("x-client-id")).toBe("client-id");

        return HttpResponse.json({
          success: true,
          data: [{ id: "collection-1", name: "Favorites" }],
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
        accessToken: "user-access-token",
      },
    });

    const content = client.content as {
      v4: { chapters: { list: () => Promise<unknown> } };
    };

    await expect(content.v4.chapters.list()).rejects.toThrowError(/server/i);

    const response =
      (await client.auth.v1.collections.list()) as CollectionListResponse;

    expect(response.success).toBe(true);
    expect(response.data[0]?.id).toBe("collection-1");
  });

  it("stores a complete user session for public authorization-code exchange", async () => {
    let storedSession: Record<string, unknown> | null = null;

    server.use(
      http.post("http://localhost:5444/oauth2/token", () =>
        HttpResponse.json({
          access_token: "public-access-token",
          expires_in: 3600,
          id_token: "public-id-token",
          refresh_token: "public-refresh-token",
          scope: "openid offline_access user",
          token_type: "bearer",
        }),
      ),
    );

    const client = createPublicClient({
      clientId: "client-id",
      clientType: "public",
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
      accessToken: "public-access-token",
      idToken: "public-id-token",
      refreshToken: "public-refresh-token",
      scope: "openid offline_access user",
      tokenType: "bearer",
    });
  });

  it("does not auto-refresh confidential browser sessions on 401 responses", async () => {
    let tokenRequests = 0;

    server.use(
      http.post("http://localhost:5444/oauth2/token", () => {
        tokenRequests += 1;

        return HttpResponse.json({
          access_token: "should-not-be-used",
          expires_in: 3600,
          refresh_token: "should-not-be-used",
          scope: "openid offline_access user",
          token_type: "bearer",
        });
      }),
      http.get("http://localhost:3001/v1/collections", () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    );

    const client = createPublicClient({
      clientId: "client-id",
      clientType: "confidential-proxy",
      services: {
        authBaseUrl: "http://localhost:3001",
        oauth2BaseUrl: "http://localhost:5444",
      },
      userSession: {
        accessToken: "expired-browser-token",
        refreshToken: "refresh-token-1",
      },
    });

    await expect(client.auth.v1.collections.list()).rejects.toThrowError(
      /401 Unauthorized/i,
    );
    expect(tokenRequests).toBe(0);
  });
});
