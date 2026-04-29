import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { OperationDefinition } from "../src/generated/contracts";
import type { OperationDefinition as PublicOperationDefinition } from "../src/generated/public-contracts";
import { server } from "../mocks/server";
import { QuranFetcher } from "../src/sdk/fetcher";
import { PublicQuranFetcher } from "../src/sdk/public-fetcher";

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
