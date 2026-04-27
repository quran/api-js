import type { OperationDefinition } from "@/generated/contracts";
import type {
  ApiParams,
  ApiService,
  CachedToken,
  CustomFetcher,
  OperationRequest,
  PublicClientConfig,
  RuntimeMode,
  ServerClientConfig,
  TokenResponse,
  UserSession,
} from "@/types";
import { retry } from "@/lib/retry";
import { paramsToString, replacePathParams } from "@/lib/url";
import humps from "humps";

const { camelizeKeys } = humps;

type RuntimeClientConfig = PublicClientConfig | ServerClientConfig;

const DEFAULT_BASE_URLS = {
  auth: "https://apis.quran.foundation/auth",
  content: "https://apis.quran.foundation/content",
  oauth2: "https://oauth2.quran.foundation",
  quranReflect: "https://apis.quran.foundation/quran-reflect",
  search: "https://apis.quran.foundation",
} as const;

const DIRECT_PATH_PREFIX = {
  auth: "/v1",
  content: "/api/v4",
  oauth2: "",
  quranReflect: "/v1",
  search: "/v1",
} as const;

const GATEWAY_PATH_PREFIX = {
  auth: "/auth/v1",
  content: "/content/api/v4",
  oauth2: "",
  quranReflect: "/quran-reflect/v1",
  search: "/search/v1",
} as const;

const LEGACY_PREFIXES = {
  auth: ["/auth/v1", "/v1"],
  content: ["/content/api/v4", "/api/v4"],
  oauth2: [""],
  quranReflect: ["/quran-reflect/v1", "/v1"],
  search: ["/search/v1", "/v1"],
} as const;

const APP_SERVICE_SCOPES: Partial<Record<ApiService, string>> = {
  content: "content",
  search: "search",
};

const USER_SESSION_EXPIRED_MESSAGE = "User session expired. Sign in again.";
const USER_SESSION_REFRESH_WINDOW_MS = 60_000;

const normalizePathTemplate = (path: string): string =>
  path.replace(/:([A-Za-z0-9_]+)/g, "{$1}");

const ensureLeadingSlash = (value: string): string =>
  value.startsWith("/") ? value : `/${value}`;

const removeTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const encodeBasicAuth = (username: string, password: string): string => {
  const raw = `${username}:${password}`;

  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw).toString("base64");
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(raw);
  }

  throw new Error("No base64 encoder available for HTTP basic auth.");
};

export class QuranFetcher {
  private appTokens = new Map<string, CachedToken>();
  private userSessionRefreshPromise: Promise<UserSession> | null = null;

  constructor(
    private readonly mode: RuntimeMode,
    private readonly config: RuntimeClientConfig,
  ) {}

  public getFetch(): CustomFetcher {
    const doFetch = this.config.fetch ?? globalThis.fetch;

    if (typeof doFetch !== "function") {
      throw new Error(
        "No fetch function available. Please provide a fetch implementation or ensure global fetch is available.",
      );
    }

    return doFetch;
  }

  public clearCachedTokens(): void {
    this.appTokens.clear();
  }

  public async getUserSession(): Promise<UserSession | null> {
    const storedSession = await this.config.storage?.getSession?.();
    return storedSession ?? this.config.userSession ?? null;
  }

  public async setUserSession(session: UserSession | null): Promise<void> {
    if (!this.config.storage) {
      return;
    }

    if (!session) {
      if (this.config.storage.clearSession) {
        await this.config.storage.clearSession();
        return;
      }

      await this.config.storage.setSession?.(null);
      return;
    }

    await this.config.storage.setSession?.(session);
  }

  public buildServiceUrl(
    service: ApiService,
    path: string,
    query?: ApiParams,
  ): string {
    const { baseUrl, usesGateway } = this.resolveServiceBaseUrl(service);
    const servicePath = this.normalizeServicePath(service, path, usesGateway);

    return `${baseUrl}${servicePath}${paramsToString(query)}`;
  }

  public async requestOperation<T = unknown>(
    operation: OperationDefinition,
    request?: OperationRequest,
  ): Promise<T> {
    return this.request<T>(
      operation.service,
      replacePathParams(operation.path, request?.path),
      request?.query,
      {
        ...request,
        auth:
          request?.auth === "auto" || !request?.auth
            ? operation.auth
            : request.auth,
        path: undefined,
      },
    );
  }

  public async request<T = unknown>(
    service: ApiService,
    path: string,
    query?: ApiParams,
    request: OperationRequest = {},
  ): Promise<T> {
    const effectiveAuth = this.resolveAuthMode(service, request.auth);

    if (this.mode === "public" && effectiveAuth === "app") {
      throw new Error(
        "This API requires @quranjs/api/server or a backend. Content and search are server-side for confidential clients.",
      );
    }

    const url = this.buildServiceUrl(service, path, query);
    const userSession = await this.getRequestUserSession(
      effectiveAuth,
      request,
    );
    let response = await this.performRequest(
      service,
      url,
      request,
      effectiveAuth,
      userSession?.accessToken,
    );

    if (
      this.shouldRetryUserRequest(response, effectiveAuth, request, userSession)
    ) {
      const refreshedSession = await this.refreshStoredUserSession();
      response = await this.performRequest(
        service,
        url,
        request,
        effectiveAuth,
        refreshedSession.accessToken,
      );
    }

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return (await response.text()) as T;
    }

    const json = await response.json();
    return camelizeKeys(json as object) as T;
  }

  public async fetch<T = unknown>(url: string, params?: ApiParams): Promise<T> {
    const route = this.resolveLegacyRoute(url);
    return this.request<T>(route.service, route.path, {
      ...this.config.defaults,
      ...params,
    });
  }

  private prepareBody(
    request: OperationRequest,
    headers: Headers,
  ): string | URLSearchParams | undefined {
    if (request.body === undefined || request.body === null) {
      return undefined;
    }

    if (
      typeof request.body === "string" ||
      request.body instanceof URLSearchParams
    ) {
      if (request.contentType) {
        headers.set("Content-Type", request.contentType);
      }

      return request.body;
    }

    headers.set("Content-Type", request.contentType ?? "application/json");
    return JSON.stringify(request.body);
  }

  private async performRequest(
    service: ApiService,
    url: string,
    request: OperationRequest,
    auth: "app" | "none" | "user",
    accessToken?: string,
  ): Promise<Response> {
    const headers = new Headers(request.headers);
    const body = this.prepareBody(request, headers);

    if (service !== "oauth2") {
      headers.set("x-client-id", this.config.clientId);
    }

    await this.applyAuthenticationHeaders(service, auth, headers, {
      ...request,
      accessToken: accessToken ?? request.accessToken,
    });

    return this.getFetch()(url, {
      body,
      headers,
      method: request.method ?? "GET",
    });
  }

  private resolveLegacyRoute(url: string): {
    path: string;
    service: ApiService;
  } {
    const normalizedPath = ensureLeadingSlash(normalizePathTemplate(url));

    if (
      normalizedPath.startsWith("/content/api/v4") ||
      normalizedPath.startsWith("/api/v4")
    ) {
      return {
        path: normalizedPath,
        service: "content",
      };
    }

    if (
      normalizedPath === "/v1/search" ||
      normalizedPath.startsWith("/search/v1")
    ) {
      return {
        path: normalizedPath,
        service: "search",
      };
    }

    if (normalizedPath.startsWith("/auth/v1")) {
      return {
        path: normalizedPath,
        service: "auth",
      };
    }

    if (normalizedPath.startsWith("/quran-reflect/v1")) {
      return {
        path: normalizedPath,
        service: "quranReflect",
      };
    }

    if (
      normalizedPath.startsWith("/oauth2") ||
      normalizedPath.startsWith("/userinfo")
    ) {
      return {
        path: normalizedPath,
        service: "oauth2",
      };
    }

    throw new Error(`Unsupported SDK route: ${url}`);
  }

  private resolveAuthMode(
    service: ApiService,
    auth: OperationRequest["auth"] = "auto",
  ): "app" | "none" | "user" {
    if (auth !== "auto") {
      return auth;
    }

    if (service === "content" || service === "search") {
      return "app";
    }

    if (service === "auth" || service === "quranReflect") {
      return "user";
    }

    return "none";
  }

  private async getRequestUserSession(
    auth: "app" | "none" | "user",
    request: OperationRequest,
  ): Promise<UserSession | null> {
    if (auth !== "user" || request.accessToken || this.mode !== "server") {
      return null;
    }

    const session = await this.getUserSession();
    if (!session?.accessToken) {
      throw new Error(
        "This operation requires a user session. Sign in first or use @quranjs/api/server.",
      );
    }

    if (!this.shouldRefreshUserSession(session)) {
      return session;
    }

    return this.refreshStoredUserSession(session);
  }

  private shouldRefreshUserSession(session: UserSession): boolean {
    if (!session.refreshToken || !session.expiresAt) {
      return false;
    }

    return session.expiresAt <= Date.now() + USER_SESSION_REFRESH_WINDOW_MS;
  }

  private shouldRetryUserRequest(
    response: Response,
    auth: "app" | "none" | "user",
    request: OperationRequest,
    session: UserSession | null,
  ): boolean {
    if (response.status !== 401) {
      return false;
    }

    if (auth !== "user" || request.accessToken || this.mode !== "server") {
      return false;
    }

    return Boolean(session?.refreshToken);
  }

  private async applyAuthenticationHeaders(
    service: ApiService,
    auth: "app" | "none" | "user",
    headers: Headers,
    request: OperationRequest,
  ): Promise<void> {
    if (request.basicAuth) {
      headers.set(
        "Authorization",
        `Basic ${encodeBasicAuth(
          request.basicAuth.username,
          request.basicAuth.password,
        )}`,
      );
    }

    if (request.accessToken) {
      this.setTokenHeaders(service, headers, request.accessToken);
      return;
    }

    if (auth === "none") {
      return;
    }

    if (auth === "app") {
      const token = await this.getAppAccessToken(service);
      this.setTokenHeaders(service, headers, token);
      return;
    }

    const session = await this.getUserSession();
    if (!session?.accessToken) {
      throw new Error(
        "This operation requires a user session. Sign in first or use @quranjs/api/server.",
      );
    }

    this.setTokenHeaders(service, headers, session.accessToken);
  }

  private async refreshStoredUserSession(
    currentSession?: UserSession | null,
  ): Promise<UserSession> {
    if (this.userSessionRefreshPromise) {
      return this.userSessionRefreshPromise;
    }

    const refreshPromise = this.executeUserSessionRefresh(currentSession);
    this.userSessionRefreshPromise = refreshPromise;

    try {
      return await refreshPromise;
    } finally {
      if (this.userSessionRefreshPromise === refreshPromise) {
        this.userSessionRefreshPromise = null;
      }
    }
  }

  private async executeUserSessionRefresh(
    currentSession?: UserSession | null,
  ): Promise<UserSession> {
    if (this.mode !== "server" || !("clientSecret" in this.config)) {
      throw new Error(
        "Automatic session refresh requires @quranjs/api/server or a backend.",
      );
    }

    const clientSecret = this.config.clientSecret;

    const session = currentSession ?? (await this.getUserSession());
    if (!session?.refreshToken) {
      throw new Error(USER_SESSION_EXPIRED_MESSAGE);
    }

    const tokenUrl = `${removeTrailingSlash(
      this.config.services?.tokenHost ??
        this.config.services?.oauth2BaseUrl ??
        DEFAULT_BASE_URLS.oauth2,
    )}/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    });

    const response = await retry(
      () =>
        this.getFetch()(tokenUrl, {
          body,
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${encodeBasicAuth(
              this.config.clientId,
              clientSecret,
            )}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        }),
      { retries: 3 },
    );

    if (!response.ok) {
      await this.setUserSession(null);
      throw new Error(USER_SESSION_EXPIRED_MESSAGE);
    }

    const token = (await response.json()) as TokenResponse;
    const refreshedSession = toUserSession(token, session);
    await this.setUserSession(refreshedSession);

    return refreshedSession;
  }

  private setTokenHeaders(
    service: ApiService,
    headers: Headers,
    accessToken: string,
  ): void {
    if (service === "oauth2") {
      headers.set("Authorization", `Bearer ${accessToken}`);
      return;
    }

    headers.set("x-auth-token", accessToken);
  }

  private async getAppAccessToken(service: ApiService): Promise<string> {
    if (this.mode !== "server") {
      throw new Error(
        "App-authenticated APIs require @quranjs/api/server or a backend.",
      );
    }

    const scope = APP_SERVICE_SCOPES[service];
    if (!scope) {
      throw new Error(
        `No client-credentials scope is configured for ${service}.`,
      );
    }

    const cacheKey = `${service}:${scope}`;
    const cachedToken = this.appTokens.get(cacheKey);

    if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
      return cachedToken.value;
    }

    if (!("clientSecret" in this.config)) {
      throw new Error("client_secret is server-only. Use @quranjs/api/server.");
    }

    const clientSecret = this.config.clientSecret;

    const tokenUrl = `${removeTrailingSlash(
      this.config.services?.tokenHost ??
        this.config.services?.oauth2BaseUrl ??
        DEFAULT_BASE_URLS.oauth2,
    )}/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    });

    const response = await retry(
      () =>
        this.getFetch()(tokenUrl, {
          body,
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${encodeBasicAuth(
              this.config.clientId,
              clientSecret,
            )}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          method: "POST",
        }),
      { retries: 3 },
    );

    if (!response.ok) {
      throw new Error(
        `Token request failed: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as TokenResponse;
    const cached = {
      expiresAt: Date.now() + json.expires_in * 1000,
      value: json.access_token,
    };

    this.appTokens.set(cacheKey, cached);
    return cached.value;
  }

  private resolveServiceBaseUrl(service: ApiService): {
    baseUrl: string;
    usesGateway: boolean;
  } {
    const { services } = this.config;
    const directBaseUrl =
      service === "content"
        ? services?.contentBaseUrl
        : service === "search"
          ? services?.searchBaseUrl
          : service === "auth"
            ? services?.authBaseUrl
            : service === "quranReflect"
              ? services?.quranReflectBaseUrl
              : (services?.oauth2BaseUrl ?? services?.tokenHost);

    if (directBaseUrl) {
      return {
        baseUrl: removeTrailingSlash(directBaseUrl),
        usesGateway: false,
      };
    }

    if (services?.gatewayUrl && service !== "oauth2") {
      return {
        baseUrl: removeTrailingSlash(services.gatewayUrl),
        usesGateway: true,
      };
    }

    return {
      baseUrl: DEFAULT_BASE_URLS[service],
      usesGateway: false,
    };
  }

  private normalizeServicePath(
    service: ApiService,
    path: string,
    usesGateway: boolean,
  ): string {
    if (service === "oauth2") {
      return ensureLeadingSlash(normalizePathTemplate(path));
    }

    let normalizedPath = ensureLeadingSlash(normalizePathTemplate(path));
    for (const prefix of LEGACY_PREFIXES[service]) {
      if (normalizedPath.startsWith(prefix)) {
        normalizedPath = ensureLeadingSlash(
          normalizedPath.slice(prefix.length),
        );
        break;
      }
    }

    const prefix = usesGateway
      ? GATEWAY_PATH_PREFIX[service]
      : DIRECT_PATH_PREFIX[service];

    if (normalizedPath.startsWith(prefix)) {
      return normalizedPath;
    }

    return `${prefix}${normalizedPath}`;
  }
}

const toUserSession = (
  token: TokenResponse & {
    accessToken?: string;
    expiresIn?: number;
    idToken?: string;
    refreshToken?: string;
    tokenType?: string;
  },
  currentSession?: UserSession | null,
): UserSession => {
  const expiresIn = token.expiresIn ?? token.expires_in;
  const accessToken = token.accessToken ?? token.access_token;
  const idToken = token.idToken ?? token.id_token ?? currentSession?.idToken;
  const refreshToken =
    token.refreshToken ?? token.refresh_token ?? currentSession?.refreshToken;
  const tokenType =
    token.tokenType ?? token.token_type ?? currentSession?.tokenType;
  const scope = token.scope ?? currentSession?.scope;
  const expiresAt = expiresIn
    ? Date.now() + expiresIn * 1000
    : currentSession?.expiresAt;

  return {
    accessToken,
    expiresAt,
    idToken,
    refreshToken,
    scope,
    tokenType,
  };
};
