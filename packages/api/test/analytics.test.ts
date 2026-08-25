import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { createPublicClient } from "../src/public";
import { createServerClient } from "../src/server";

const EVENT_ID = "evt_01j60x3y6n7r8s9t0v1w2x3y4z";

describe("Analytics Events API", () => {
  it("submits typed events with the analytics client-credentials scope", async () => {
    let tokenRequestBody = "";
    let requestBody: unknown;
    let requestHeaders: Headers | undefined;

    server.use(
      http.post("http://localhost:5444/oauth2/token", async ({ request }) => {
        tokenRequestBody = await request.text();
        expect(request.headers.get("authorization")).toBe(
          `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
        );

        return HttpResponse.json({
          access_token: "analytics-token",
          expires_in: 3600,
          scope: "analytics.events.write",
          token_type: "bearer",
        });
      }),
      http.post(
        "http://localhost:3030/v1/events:batch",
        async ({ request }) => {
          requestHeaders = request.headers;
          requestBody = await request.json();

          return HttpResponse.json(
            {
              accepted: 2,
              batch_id: "d77a3c27-8365-4c57-a3ae-cf8ab8cb62c2",
            },
            { status: 202 },
          );
        },
      ),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        analyticsBaseUrl: "http://localhost:3030",
        tokenHost: "http://localhost:5444",
      },
    });

    const response = await client.analytics.v1.events.submit({
      events: [
        {
          eventId: EVENT_ID,
          name: "quran.reader.verse_viewed",
          occurredAt: new Date("2026-08-22T07:12:15Z"),
          properties: {
            already_snake_case: true,
            callerDefinedKey: "preserved",
          },
          sessionId: "session-1",
          userId: "qf-user-1",
          version: 1,
        },
        {
          anonymousId: "anonymous-1",
          eventId: "evt_02j60x3y6n7r8s9t0v1w2x3y4z",
          name: "quran.app.started",
          occurredAt: "2026-08-22T07:12:16Z",
          version: 1,
        },
      ],
    });

    expect(tokenRequestBody).toBe(
      "grant_type=client_credentials&scope=analytics.events.write",
    );
    expect(requestHeaders?.get("x-client-id")).toBe("client-id");
    expect(requestHeaders?.get("x-auth-token")).toBe("analytics-token");
    expect(requestBody).toEqual({
      events: [
        {
          event_id: EVENT_ID,
          name: "quran.reader.verse_viewed",
          occurred_at: "2026-08-22T07:12:15.000Z",
          properties: {
            already_snake_case: true,
            callerDefinedKey: "preserved",
          },
          session_id: "session-1",
          user_id: "qf-user-1",
          version: 1,
        },
        {
          anonymous_id: "anonymous-1",
          event_id: "evt_02j60x3y6n7r8s9t0v1w2x3y4z",
          name: "quran.app.started",
          occurred_at: "2026-08-22T07:12:16Z",
          version: 1,
        },
      ],
    });
    expect(response).toEqual({
      accepted: 2,
      batchId: "d77a3c27-8365-4c57-a3ae-cf8ab8cb62c2",
    });
  });

  it("uses the Analytics Gateway path when gatewayUrl is configured", async () => {
    let analyticsUrl = "";

    server.use(
      http.post("http://localhost:5444/oauth2/token", () =>
        HttpResponse.json({
          access_token: "analytics-token",
          expires_in: 3600,
        }),
      ),
      http.post(
        "http://localhost:8787/analytics/v1/events:batch",
        ({ request }) => {
          analyticsUrl = request.url;
          return HttpResponse.json(
            { accepted: 1, batch_id: "batch-1" },
            { status: 202 },
          );
        },
      ),
    );

    const client = createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      services: {
        gatewayUrl: "http://localhost:8787",
        tokenHost: "http://localhost:5444",
      },
    });

    await client.analytics.v1.events.submit({
      events: [
        {
          eventId: EVENT_ID,
          name: "quran.app.started",
          occurredAt: "2026-08-22T07:12:15Z",
          version: 1,
        },
      ],
    });

    expect(analyticsUrl).toBe(
      "http://localhost:8787/analytics/v1/events:batch",
    );
  });

  it("does not expose Analytics through the public client", () => {
    const client = createPublicClient({
      clientId: "public-client-id",
      clientType: "public",
    });

    expect("analytics" in client).toBe(false);
    expect("analytics" in client.raw).toBe(false);
  });
});
