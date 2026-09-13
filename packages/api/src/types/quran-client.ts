import type { AuthService } from "@/generated/public-contracts";

import type { ApiParams, BaseApiParams } from "./BaseApiParams";

/**
 * Custom fetcher function type that matches the native fetch API
 */
export type CustomFetcher = typeof fetch;

export type RuntimeMode = "server" | "public";

export type HTTPMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export interface QuranFetchClient {
  fetch<T = unknown>(url: string, params?: ApiParams): Promise<T>;
}

export type ApiService =
  | "analytics"
  | "content"
  | "search"
  | AuthService
  | "oauth2";

export interface ServiceEnvironmentConfig {
  gatewayUrl?: string;
  tokenHost?: string;
  oauth2BaseUrl?: string;
  analyticsBaseUrl?: string;
  contentBaseUrl?: string;
  searchBaseUrl?: string;
  authBaseUrl?: string;
  quranReflectBaseUrl?: string;
}

export interface QuranClientConfig {
  /** Client ID for authentication */
  clientId: string;
  /** Client secret for authentication */
  clientSecret: string;
  /** Legacy gateway base URL for content/search APIs */
  contentBaseUrl?: string;
  /** Legacy OAuth2 token host URL */
  authBaseUrl?: string;
  /** Custom fetch implementation */
  fetch?: CustomFetcher;
  /** Default parameters for all API calls */
  defaults?: Partial<BaseApiParams>;
}

export interface UserSession {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
  tokenType?: string;
  expiresAt?: number;
}

export interface TokenStorage {
  getSession?: () =>
    | UserSession
    | null
    | undefined
    | Promise<UserSession | null | undefined>;
  setSession?: (session: UserSession | null) => void | Promise<void>;
  clearSession?: () => void | Promise<void>;
}

/**
 * Which content scopes the SDK asks for when it fetches an app access token.
 *
 * `legacy` is the default and the pre-split behavior: one `content` scope for every content call.
 * It keeps working for credentials that were granted `content`.
 *
 * `granular` asks for the specific scope the operation needs, from the pinned operation catalog.
 * Required for credentials issued under the granular policy, which are never granted `content`.
 *
 * The default will only change in a deliberately versioned release.
 */
export type ContentScopeMode = "legacy" | "granular";

interface BaseRuntimeClientConfig {
  clientId: string;
  fetch?: CustomFetcher;
  defaults?: Partial<BaseApiParams>;
  services?: ServiceEnvironmentConfig;
  userSession?: UserSession;
  storage?: TokenStorage;
  /**
   * Content scope mode. Defaults to `legacy`.
   *
   * Set to `granular` when your credentials were issued with the granular content scopes
   * (`content.quran.read` and friends) rather than the `content` umbrella.
   */
  contentScopeMode?: ContentScopeMode;
  /** Token audience, when your credentials are issued for a specific audience. */
  audience?: string;
}

export interface ServerClientConfig extends BaseRuntimeClientConfig {
  clientSecret: string;
}

export interface PublicClientConfig extends BaseRuntimeClientConfig {
  clientType: "public" | "confidential-proxy";
}

export interface CachedToken {
  value: string;
  expiresAt: number;
  /** Scopes the authorization server actually granted, when it reported them. */
  grantedScopes?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface OperationRequest {
  path?: Record<string, string | number>;
  query?: ApiParams;
  body?: string | URLSearchParams | Record<string, unknown> | null;
  headers?: Record<string, string>;
  method?: HTTPMethod;
  auth?: "auto" | "none" | "app" | "user";
  accessToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
  contentType?: string;
}
