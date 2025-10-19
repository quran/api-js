import { describe, expect, it, vi } from "vitest";

import { QuranFetcher } from "../src/sdk/fetcher";
import { Language } from "../src/types";

const baseConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
  contentBaseUrl: "https://apis.quran.foundation",
  authBaseUrl: "https://oauth2.quran.foundation",
  defaults: {
    language: Language.ENGLISH,
    perPage: 25,
  },
} as const;

type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

const createResponse = <T>(
  data: T,
  overrides: Partial<MockResponse> = {},
): MockResponse =>
  ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => data,
    ...overrides,
  });

describe("QuranFetcher", () => {
  it("requests an access token once and reuses it for subsequent API calls", async () => {
    const fetchMock = vi
      .fn<[string, RequestInit?], Promise<MockResponse>>()
      .mockResolvedValueOnce(
        createResponse({
          access_token: "token-123",
          token_type: "bearer",
          expires_in: 3600,
          scope: "content",
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          sample_value: 42,
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          sample_value: 84,
        }),
      );

    const fetcher = new QuranFetcher({
      ...baseConfig,
      fetch: fetchMock,
    });

    const firstResult = await fetcher.fetch<{ sampleValue: number }>(
      "/content/api/v4/example",
      {
        page: 2,
        words: true,
      },
    );

    const secondResult = await fetcher.fetch<{ sampleValue: number }>(
      "/content/api/v4/example",
      { page: 3 },
    );

    expect(firstResult.sampleValue).toBe(42);
    expect(secondResult.sampleValue).toBe(84);

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const [tokenUrl, tokenOptions] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe(`${baseConfig.authBaseUrl}/oauth2/token`);
    expect(tokenOptions?.method).toBe("POST");
    expect(tokenOptions?.headers).toMatchObject({
      Authorization: expect.stringContaining("Basic "),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    });

    const tokenBody = new URLSearchParams(
      tokenOptions?.body as string,
    );
    expect(tokenBody.get("grant_type")).toBe("client_credentials");
    expect(tokenBody.get("scope")).toBe("content");

    const [firstDataUrl, firstDataOptions] = fetchMock.mock.calls[1];
    const firstUrl = new URL(firstDataUrl as string);
    expect(firstUrl.origin + firstUrl.pathname).toBe(
      `${baseConfig.contentBaseUrl}/content/api/v4/example`,
    );
    expect(firstUrl.searchParams.get("language")).toBe(Language.ENGLISH);
    expect(firstUrl.searchParams.get("per_page")).toBe("25");
    expect(firstUrl.searchParams.get("page")).toBe("2");
    expect(firstUrl.searchParams.get("words")).toBe("true");

    const [secondDataUrl, secondDataOptions] = fetchMock.mock.calls[2];
    const secondUrl = new URL(secondDataUrl as string);
    expect(secondUrl.searchParams.get("page")).toBe("3");

    expect(firstDataOptions?.headers).toMatchObject({
      "x-auth-token": "token-123",
      "x-client-id": baseConfig.clientId,
      "Content-Type": "application/json",
    });

    expect(secondDataOptions?.headers).toMatchObject({
      "x-auth-token": "token-123",
      "x-client-id": baseConfig.clientId,
    });
  });

  it("throws an error when the API response is not ok", async () => {
    const fetchMock = vi
      .fn<[string, RequestInit?], Promise<MockResponse>>()
      .mockResolvedValueOnce(
        createResponse({
          access_token: "token-456",
          token_type: "bearer",
          expires_in: 3600,
          scope: "content",
        }),
      )
      .mockResolvedValueOnce(
        createResponse(
          { error: "server failure" },
          { ok: false, status: 500, statusText: "Server Error" },
        ),
      );

    const fetcher = new QuranFetcher({
      ...baseConfig,
      fetch: fetchMock,
    });

    await expect(
      fetcher.fetch("/content/api/v4/example"),
    ).rejects.toThrowError("500 Server Error");
  });
});
