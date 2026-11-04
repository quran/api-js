import type {
  ApiParams,
  CachedToken,
  CustomFetcher,
  QuranClientConfig,
  TokenResponse,
} from "@/types";
import { encodeBasicAuth } from "@/lib/http-utils";
import { retry } from "@/lib/retry";
import { API_BASE_URL, DEFAULT_BASE_URLS } from "@/lib/service-config";
import { paramsToString, removeBeginningSlash } from "@/lib/url";
import { Language } from "@/types";
import humps from "humps";

import { QuranAnswers } from "./answers";
import { QuranAudio } from "./audio";
import { QuranChapters } from "./chapters";
import { QuranHadithReferences } from "./hadith-references";
import { QuranJuzs } from "./juzs";
import { QuranResources } from "./resources";
import { QuranSearch } from "./search";
import { QuranVerses } from "./verses";

const { camelizeKeys } = humps;
/** Pre-split default. Overridden by `QuranClientConfig.scope`. */
const LEGACY_CLIENT_CREDENTIALS_SCOPE = "content search";

type LegacyConfig = Required<
  Pick<QuranClientConfig, "authBaseUrl" | "contentBaseUrl">
> &
  Omit<QuranClientConfig, "authBaseUrl" | "contentBaseUrl">;

class LegacyQuranFetcher {
  /** The cached token, with the issuer/client/scope key it was fetched for. */
  private cachedToken: (CachedToken & { key: string }) | null = null;
  /**
   * Bumped whenever the cache is invalidated, so a token request already in flight for the old
   * configuration cannot write its result back afterwards.
   */
  private cacheGeneration = 0;

  constructor(private config: LegacyConfig) {}

  public updateConfig(config: LegacyConfig): void {
    // A token fetched for one issuer, client, secret or scope set must not be reused for another.
    if (
      this.tokenKey(config) !== this.tokenKey(this.config) ||
      config.clientSecret !== this.config.clientSecret
    ) {
      this.clearCachedToken();
    }
    this.config = config;
  }

  private tokenKey(config: LegacyConfig): string {
    return [config.authBaseUrl, config.clientId, this.requestedScope(config)].join("|");
  }

  private requestedScope(config: LegacyConfig = this.config): string {
    const scope = config.scope?.trim().split(/\s+/u).filter(Boolean).join(" ");
    return scope || LEGACY_CLIENT_CREDENTIALS_SCOPE;
  }

  public getFetch(): CustomFetcher {
    const doFetch = this.config.fetch ?? globalThis.fetch;

    if (typeof doFetch !== "function") {
      throw new Error(
        "No fetch function available. Please provide a fetch implementation or ensure global fetch is available.",
      );
    }

    return doFetch;
  }

  public clearCachedToken(): void {
    this.cacheGeneration += 1;
    this.cachedToken = null;
  }

  public async fetch<T = unknown>(url: string, params?: ApiParams): Promise<T> {
    const token = await this.getAccessToken();
    const response = await this.getFetch()(this.makeUrl(url, params), {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": token,
        "x-client-id": this.config.clientId,
      },
    });

    if (!response.ok || response.status >= 400) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return camelizeKeys(json as object) as T;
  }

  private makeUrl(url: string, params?: ApiParams): string {
    return `${this.config.contentBaseUrl}/${removeBeginningSlash(
      url,
    )}${paramsToString({ ...this.config.defaults, ...params })}`;
  }

  private async getAccessToken(): Promise<string> {
    // Capture the configuration once, so the whole token request uses one consistent identity.
    const config = this.config;
    const key = this.tokenKey(config);
    const generation = this.cacheGeneration;

    if (
      this.cachedToken &&
      this.cachedToken.key === key &&
      this.cachedToken.expiresAt > Date.now() + 30_000
    ) {
      return this.cachedToken.value;
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: this.requestedScope(config),
    }).toString();

    const response = await retry(
      () =>
        this.getFetch()(`${config.authBaseUrl}/oauth2/token`, {
          body,
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${encodeBasicAuth(
              config.clientId,
              config.clientSecret,
            )}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        }),
      { retries: 3 },
    );

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    const json = (await response.json()) as TokenResponse;

    const token = {
      expiresAt: Date.now() + json.expires_in * 1000,
      key,
      value: json.access_token,
    };

    // The configuration changed (or the cache was cleared) while this request was in flight:
    // serve this one call, but never cache a token fetched for the old identity or scope.
    if (this.cacheGeneration === generation) {
      this.cachedToken = token;
    }

    return token.value;
  }
}

/**
 * Legacy universal Quran API client.
 *
 * Prefer `createPublicClient` from `@quranjs/api/public` or
 * `createServerClient` from `@quranjs/api/server` for new applications.
 */
export class QuranClient {
  private config: LegacyConfig;
  private fetcher: LegacyQuranFetcher;

  public readonly chapters: QuranChapters;
  public readonly answers: QuranAnswers;
  public readonly verses: QuranVerses;
  public readonly juzs: QuranJuzs;
  public readonly audio: QuranAudio;
  public readonly hadithReferences: QuranHadithReferences;
  public readonly resources: QuranResources;
  public readonly search: QuranSearch;

  constructor(config: QuranClientConfig) {
    this.config = {
      authBaseUrl: DEFAULT_BASE_URLS.oauth2,
      contentBaseUrl: API_BASE_URL,
      ...config,
      defaults: {
        language: Language.ARABIC,
        ...config.defaults,
      },
    };

    this.fetcher = new LegacyQuranFetcher(this.config);
    this.fetcher.getFetch();

    this.answers = new QuranAnswers(this.fetcher);
    this.chapters = new QuranChapters(this.fetcher);
    this.verses = new QuranVerses(this.fetcher);
    this.juzs = new QuranJuzs(this.fetcher);
    this.audio = new QuranAudio(this.fetcher);
    this.hadithReferences = new QuranHadithReferences(this.fetcher);
    this.resources = new QuranResources(this.fetcher);
    this.search = new QuranSearch(this.fetcher);
  }

  public getConfig(): QuranClientConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<QuranClientConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      defaults: {
        ...this.config.defaults,
        ...newConfig.defaults,
      },
    };

    this.fetcher.updateConfig(this.config);
  }

  public clearCachedToken(): void {
    this.fetcher.clearCachedToken();
  }
}
