import type { ApiParams, BaseApiParams } from "./BaseApiParams";

/**
 * Custom fetcher function type that matches the native fetch API
 */
export type CustomFetcher = typeof fetch;

export type RuntimeMode = "server" | "public";

export type ApiService =
  | "content"
  | "search"
  | "auth"
  | "quranReflect"
  | "oauth2";

export interface ServiceEnvironmentConfig {
  gatewayUrl?: string;
  tokenHost?: string;
  oauth2BaseUrl?: string;
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

interface BaseRuntimeClientConfig {
  clientId: string;
  fetch?: CustomFetcher;
  defaults?: Partial<BaseApiParams>;
  services?: ServiceEnvironmentConfig;
  userSession?: UserSession;
  storage?: TokenStorage;
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
  method?: "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
  auth?: "auto" | "none" | "app" | "user";
  accessToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
  contentType?: string;
}
