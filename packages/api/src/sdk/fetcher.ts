import type {
  ApiParams,
  CachedToken,
  QuranClientConfig,
  TokenResponse,
} from "@/types";
import { retry } from "@/lib/retry";
import { paramsToString, removeBeginningSlash } from "@/lib/url";
import humps from "humps";

const { camelizeKeys } = humps;

type Config = Required<
  Pick<QuranClientConfig, "contentBaseUrl" | "authBaseUrl">
> &
  Omit<QuranClientConfig, "contentBaseUrl" | "authBaseUrl">;

/**
 * Handles HTTP requests with authentication for the Quran API
 */
export class QuranFetcher {
  private cachedToken: CachedToken | null = null;

  constructor(private config: Config) {}

  /**
   * Update the configuration
   */
  updateConfig(config: Config): void {
    this.config = config;
  }

  private doFetch(...args: Parameters<typeof fetch>) {
    const { fetch: fetchFn } = this.config;
    const doFetch = fetchFn ?? globalThis.fetch;

    if (typeof doFetch !== "function") {
      throw new Error(
        "No fetch function available. Please provide a fetch implementation or ensure global fetch is available.",
      );
    }

    return doFetch(...args);
  }

  /**
   * Get access token for API authentication
   */
  private async getAccessToken(): Promise<string> {
    // add 30 seconds to the expiration time to account for clock skew
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 30_000) {
      return this.cachedToken.value; // still fresh
    }

    const { clientId, clientSecret, authBaseUrl } = this.config;

    const auth = btoa(`${clientId}:${clientSecret}`);

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }).toString();

    const res = await retry(
      () =>
        this.doFetch(`${authBaseUrl}/oauth2/token`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body,
        }),
      { retries: 3 },
    );

    if (!res.ok) {
      throw new Error(`Token request failed: ${res.statusText}`);
    }

    const json = (await res.json()) as TokenResponse;

    // Calculate expiration time (current time + expires_in seconds - converted to milliseconds)
    const expiresAt = Date.now() + json.expires_in * 1000;

    this.cachedToken = {
      value: json.access_token,
      expiresAt,
    };

    return this.cachedToken.value;
  }

  /**
   * Clear cached token (useful for testing or forcing re-authentication)
   */
  clearCachedToken(): void {
    this.cachedToken = null;
  }

  /**
   * Make URL with base URL and query parameters
   */
  private makeUrl(url: string, params?: ApiParams): string {
    const { contentBaseUrl } = this.config;
    return `${contentBaseUrl}/${removeBeginningSlash(url)}${paramsToString(params)}`;
  }

  /**
   * Make authenticated HTTP request
   */
  async fetch<T extends object>(url: string, params?: ApiParams): Promise<T> {
    const { clientId, defaults } = this.config;

    const token = await this.getAccessToken();
    const fullUrl = this.makeUrl(url, { ...defaults, ...params });

    const res = await this.doFetch(fullUrl, {
      headers: {
        "x-auth-token": token,
        "x-client-id": clientId,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok || res.status >= 400) {
      throw new Error(`${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return camelizeKeys(json as object) as T;
  }
}
