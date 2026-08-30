import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { createPublicClient } from "../src/public";
import { createServerClient } from "../src/server";

const ETAG = '"s_6UYAfR2WOsf0gHaRMUXBw2kP1S-kRXyCmbCl6yZpk"';

const publicClient = () =>
  createPublicClient({
    clientId: "client-id",
    clientType: "confidential-proxy",
    services: { authBaseUrl: "http://localhost:3001" },
    userSession: { accessToken: "user-access-token" },
  });

describe("App State facade", () => {
  it("uses literal action paths, exact queries, and user auth", async () => {
    const requests: Request[] = [];
    const respond = ({ request }: { request: Request }) => {
      requests.push(request);
      expect(request.headers.get("x-auth-token")).toBe("user-access-token");
      expect(request.headers.get("x-client-id")).toBe("client-id");
      return HttpResponse.json({ success: true, data: {} });
    };

    server.use(
      http.get("http://localhost:3001/v1/app-state:config", respond),
      http.get("http://localhost:3001/v1/app-state:bootstrap", respond),
      http.get("http://localhost:3001/v1/app-state:changes", respond),
      http.get("http://localhost:3001/v1/app-state/reader.settings", respond),
    );

    const appState = publicClient().auth.v1.appState;
    await appState.getConfiguration();
    await appState.bootstrap({ cursor: "v2.bootstrap", limit: 25 });
    await appState.getChanges("v2.sync", { limit: 50 });
    await appState.listDocuments("reader.settings", {
      cursor: "v2.page",
      limit: 10,
    });

    expect(requests.map(({ url }) => new URL(url).pathname)).toEqual([
      "/v1/app-state:config",
      "/v1/app-state:bootstrap",
      "/v1/app-state:changes",
      "/v1/app-state/reader.settings",
    ]);
    expect(new URL(requests[1]!.url).searchParams).toEqual(
      new URLSearchParams({ cursor: "v2.bootstrap", limit: "25" }),
    );
    expect(new URL(requests[2]!.url).searchParams).toEqual(
      new URLSearchParams({ limit: "50", since: "v2.sync" }),
    );
    expect(new URL(requests[3]!.url).searchParams).toEqual(
      new URLSearchParams({ cursor: "v2.page", limit: "10" }),
    );
  });

  it("encodes document keys and preserves quoted response ETags", async () => {
    server.use(
      http.get(
        "http://localhost:3001/v1/app-state/settings/theme%3Fmode%3Ddark",
        () =>
          HttpResponse.json(
            {
              success: true,
              data: { value: { font_size: 18, mixedCase: "unchanged" } },
            },
            { headers: { ETag: ETAG } },
          ),
      ),
    );

    const response = await publicClient().auth.v1.appState.getDocument(
      "settings",
      "theme?mode=dark",
    );

    expect(response.etag).toBe(ETAG);
    expect(response.status).toBe(200);
    expect(response.data.value).toEqual({
      font_size: 18,
      mixedCase: "unchanged",
    });
  });

  it("sends the complete PUT body and exact mutation headers", async () => {
    server.use(
      http.put(
        "http://localhost:3001/v1/app-state/settings/theme",
        async ({ request }) => {
          expect(request.headers.get("idempotency-key")).toBe(
            "01HZX4EXAMPLE8J4K7M2PQ9RST",
          );
          expect(request.headers.get("if-match")).toBe(ETAG);
          expect(request.headers.has("if-none-match")).toBe(false);
          expect(await request.json()).toEqual({
            value: { font_size: null },
            schemaVersion: 1,
          });
          return HttpResponse.json(
            { success: true, data: { version: 2 } },
            { headers: { ETag: ETAG }, status: 201 },
          );
        },
      ),
    );

    const result = await publicClient().auth.v1.appState.putDocument(
      "settings",
      "theme",
      { value: { font_size: null }, schemaVersion: 1 },
      {
        idempotencyKey: "01HZX4EXAMPLE8J4K7M2PQ9RST",
        ifMatch: ETAG,
      },
    );

    expect(result.etag).toBe(ETAG);
    expect(result.status).toBe(201);
    expect(result.data.version).toBe(2);
  });

  it("exposes App State through the server client and forwards DELETE preconditions", async () => {
    server.use(
      http.delete(
        "http://localhost:3001/v1/app-state/settings/theme",
        ({ request }) => {
          expect(request.headers.get("x-auth-token")).toBe("server-user-token");
          expect(request.headers.get("idempotency-key")).toBe(
            "01HZX4EXAMPLE8J4K7M2PQ9RST",
          );
          expect(request.headers.get("if-none-match")).toBe("*");
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: { authBaseUrl: "http://localhost:3001" },
      userSession: { accessToken: "server-user-token" },
    });

    await expect(
      client.auth.v1.appState.deleteDocument("settings", "theme", {
        idempotencyKey: "01HZX4EXAMPLE8J4K7M2PQ9RST",
        ifNoneMatch: "*",
      }),
    ).resolves.toBeUndefined();
  });
});
