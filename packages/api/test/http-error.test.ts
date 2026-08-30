import { describe, expect, it } from "vitest";

import { QuranHttpError as RootQuranHttpError } from "../src";
import { createPublicClient, QuranHttpError } from "../src/public";
import {
  createServerClient,
  QuranHttpError as ServerQuranHttpError,
} from "../src/server";

const CLIENTS = {
  public: (fetch: typeof globalThis.fetch) =>
    createPublicClient({
      clientId: "client-id",
      clientType: "confidential-proxy",
      fetch,
      userSession: { accessToken: "user-access-token" },
    }),
  server: (fetch: typeof globalThis.fetch) =>
    createServerClient({
      clientId: "client-id",
      clientSecret: "client-secret",
      fetch,
      userSession: { accessToken: "user-access-token" },
    }),
} as const;

const JSON_FAILURES = [
  {
    payload: {
      details: { error: "idempotency_key_reused" },
      message: "The idempotency key was reused for a different request.",
      success: false,
      type: "service_error",
    },
    status: 409,
    statusText: "Conflict",
  },
  {
    payload: {
      details: { error: "bootstrap_required" },
      message: "Bootstrap is required to recover App State.",
      success: false,
      type: "gone",
    },
    status: 410,
    statusText: "Gone",
  },
  {
    payload: {
      details: {
        currentETag: '"s_6UYAfR2WOsf0gHaRMUXBw2kP1S-kRXyCmbCl6yZpk"',
        error: "precondition_failed",
      },
      message: "The document changed after the supplied ETag.",
      success: false,
      type: "precondition_failed",
    },
    status: 412,
    statusText: "Precondition Failed",
  },
] as const;

const captureFailure = async (operation: () => Promise<unknown>) => {
  try {
    await operation();
  } catch (error) {
    return error;
  }

  throw new Error("Expected the request to fail.");
};

describe.each(Object.entries(CLIENTS))("%s client HTTP errors", (_name, createClient) => {
  it.each(JSON_FAILURES)(
    "preserves a Backend-compatible $status JSON failure",
    async ({ payload, status, statusText }) => {
      const client = createClient(() =>
        Promise.resolve(
          Response.json(payload, {
            headers: { "x-request-id": `request-${status}` },
            status,
            statusText,
          }),
        ),
      );

      const error = await captureFailure(() =>
        client.auth.v1.appState.getConfiguration(),
      );

      expect(error).toBeInstanceOf(QuranHttpError);
      expect(error).toMatchObject({
        headers: expect.any(Headers),
        message: `${status} ${statusText}`,
        payload,
        status,
      });
      expect((error as { headers: Headers }).headers.get("x-request-id")).toBe(
        `request-${status}`,
      );
    },
  );

  it("preserves a non-JSON failure body", async () => {
    const client = createClient(() =>
      Promise.resolve(
        new Response("upstream unavailable", {
          headers: {
            "content-type": "text/plain",
            "retry-after": "30",
          },
          status: 503,
          statusText: "Service Unavailable",
        }),
      ),
    );

    const error = await captureFailure(() =>
      client.auth.v1.appState.getConfiguration(),
    );

    expect(error).toBeInstanceOf(QuranHttpError);
    expect(error).toMatchObject({
      headers: expect.any(Headers),
      message: "503 Service Unavailable",
      payload: "upstream unavailable",
      status: 503,
    });
    expect((error as { headers: Headers }).headers.get("retry-after")).toBe("30");
  });
});

it("exports one shared HTTP error type from every entrypoint", () => {
  expect(RootQuranHttpError).toBe(QuranHttpError);
  expect(ServerQuranHttpError).toBe(QuranHttpError);
});
