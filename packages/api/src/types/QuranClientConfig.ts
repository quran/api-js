import type { BaseApiParams } from "./BaseApiParams";

/**
 * Custom fetcher function type that matches the native fetch API
 */
export type CustomFetcher = typeof fetch;

export interface QuranClientConfig {
  /** Client ID for authentication */
  clientId: string;
  /** Client secret for authentication */
  clientSecret: string;
  /** Base URL for content APIs */
  contentBaseUrl?: string;
  /** Base URL for authentication */
  authBaseUrl?: string;
  /** Custom fetch implementation */
  fetch?: CustomFetcher;

  /** Default parameters for all API calls */
  defaults?: Partial<BaseApiParams>;
}

export interface CachedToken {
  value: string;
  expiresAt: number;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
}
