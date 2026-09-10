import type { OperationDefinition } from "@/generated/contracts";
import type {
  ApiParams,
  ApiService,
  CachedToken,
  ContentScopeMode,
  CustomFetcher,
  OperationRequest,
  PublicClientConfig,
  RuntimeMode,
  ServerClientConfig,
  TokenResponse,
  UserSession,
} from "@/types";
import { lookupContentScopes } from "@/lib/content-scope-lookup";
import { encodeBasicAuth, prepareBody, toUserSession } from "@/lib/http-utils";
import { retry } from "@/lib/retry";
import {
  API_BASE_URL,
  DEFAULT_BASE_URLS,
  DIRECT_PATH_PREFIX,
  GATEWAY_PATH_PREFIX,
  LEGACY_PREFIXES,
} from "@/lib/service-config";
import {
  ensureLeadingSlash,
  normalizePathTemplate,
  paramsToString,
  removeTrailingSlash,
  replacePathParams,
} from "@/lib/url";
import humps from "humps";

const { camelizeKeys } = humps;

type RuntimeClientConfig = PublicClientConfig | ServerClientConfig;

const APP_SERVICE_SCOPES: Partial<Record<ApiService, string>> = {
  analytics: "analytics.events.write",
  content: "content",
  search: "search",
};
const QURAN_REFLECT_POSTS_PATH_PREFIX = "/quran-reflect/v1/posts/";
const QURAN_REFLECT_COMMENT_PATH_SUFFIXES = [
  "/comments",
  "/all-comments",
] as const;
const DEFAULT_CONTENT_SCOPE_MODE: ContentScopeMode = "legacy";
const INSUFFICIENT_SCOPE_STATUSES = new Set([401, 403]);
const GATEWAY_SERVICES = [
  "analytics",
  "auth",
  "content",
  "quranReflect",
  "search",
] as const satisfies readonly ApiService[];

const USER_SESSION_EXPIRED_MESSAGE = "User session expired. Sign in again.";
const REFRESH_TOKEN_REJECTION_ERROR = "invalid_grant";
const USER_SESSION_REFRESH_WINDOW_MS = 60_000;

const readResponseBody = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const isRefreshTokenRejection = (
  response: Response,
  responseBody: string,
): boolean => {
  if (
    response.status < 400 ||
    response.status >= 500 ||
    response.status === 429
  ) {
    return false;
  }

  return responseBody.toLowerCase().includes(REFRESH_TOKEN_REJECTION_ERROR);
};

const formatRefreshFailureMessage = (
  response: Response,
  responseBody: string,
): string => {
  const body = responseBody.trim();
  const details = body ? `: ${body}` : "";

  return `Token refresh failed: ${response.status} ${response.statusText}${details}`;
};

export class QuranFetcher {
  private appTokens = new Map<string, CachedToken>();
  // Concurrent calls needing the same scope set share one token request, so code that fires
  // several requests at once does not open several identical client-credentials exchanges.
  private appTokenRequests = new Map<string, Promise<CachedToken>>();
  private userSession: UserSession | null | undefined;
  private userSessionRefreshPromise: Promise<UserSession> | null = null;

  constructor(
    private readonly mode: RuntimeMode,
    private readonly config: RuntimeClientConfig,
  ) {
    this.userSession = config.userSession;
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

  public clearCachedTokens(): void {
    this.appTokens.clear();
    this.appTokenRequests.clear();
  }

  public async getUserSession(): Promise<UserSession | null> {
    const storedSession = await this.config.storage?.getSession?.();
    if (storedSession !== undefined) {
      return storedSession;
    }

    return this.userSession ?? null;
  }

  public async setUserSession(session: UserSession | null): Promise<void> {
    if (!this.config.storage) {
      this.userSession = session;
      return;
    }

    if (!session) {
      if (this.config.storage.clearSession) {
        await this.config.storage.clearSession();
        this.userSession = null;
        return;
      }

      await this.config.storage.setSession?.(null);
      this.userSession = null;
      return;
    }

    await this.config.storage.setSession?.(session);
    this.userSession = session;
  }

  public buildServiceUrl(
    service: ApiService,
    path: string,
    query?: ApiParams,
  ): string {
    const crossServiceGatewayPath = this.isCrossServiceGatewayPath(
      service,
      path,
    );
    const { baseUrl, usesGateway } = this.resolveServiceBaseUrl(
      service,
      crossServiceGatewayPath,
    );
    const servicePath = this.normalizeServicePath(
      service,
      path,
      usesGateway,
      crossServiceGatewayPath,
    );
    const preserveQueryParamCase =
      service === "auth" || service === "quranReflect";

    return `${baseUrl}${servicePath}${paramsToString(query, {
      preserveCase: preserveQueryParamCase,
    })}`;
  }

  public async requestOperation<T = unknown>(
    operation: OperationDefinition,
    request?: OperationRequest,
  ): Promise<T> {
    return this.requestInternal<T>(
      operation.service,
      replacePathParams(operation.path, request?.path),
      request?.query,
      {
        ...request,
        auth:
          request?.auth === "auto" || !request?.auth
            ? operation.auth
            : request.auth,
        method:
          request?.method ??
          (operation.method.toUpperCase() as OperationRequest["method"]),
        path: undefined,
      },
      // Carrying the operation through is what lets granular mode ask for the one scope this
      // call needs instead of a service-wide scope.
      operation,
    );
  }

  public async request<T = unknown>(
    service: ApiService,
    path: string,
    query?: ApiParams,
    request: OperationRequest = {},
  ): Promise<T> {
    return this.requestInternal<T>(service, path, query, request);
  }

  private async requestInternal<T = unknown>(
    service: ApiService,
    path: string,
    query?: ApiParams,
    request: OperationRequest = {},
    operation?: OperationDefinition,
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
      operation,
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
        operation,
      );
    }

    // A missing permission is never retried with a broader scope. Widening the request would
    // paper over a misconfigured client and hand it more access than it was granted; the caller
    // needs to see the failure and fix the scope or the client's approvals.
    if (
      INSUFFICIENT_SCOPE_STATUSES.has(response.status) &&
      effectiveAuth === "app"
    ) {
      throw new Error(
        `${response.status} ${response.statusText}. ` +
          `The app token did not carry a scope this endpoint accepts. ` +
          `Requested scope: ${this.describeRequestedAppScope(service, url, operation, request.method ?? "GET")}. ` +
          `Check the scopes granted to client ${this.config.clientId}` +
          (this.contentScopeMode() === "legacy"
            ? `, or set contentScopeMode: "granular" if these credentials were issued with granular content scopes.`
            : `.`),
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

  private async performRequest(
    service: ApiService,
    url: string,
    request: OperationRequest,
    auth: "app" | "none" | "user",
    accessToken?: string,
    operation?: OperationDefinition,
  ): Promise<Response> {
    const headers = new Headers(request.headers);
    const body = prepareBody(request, headers);

    if (service !== "oauth2") {
      headers.set("x-client-id", this.config.clientId);
    }

    await this.applyAuthenticationHeaders(
      service,
      auth,
      headers,
      {
        ...request,
        accessToken: accessToken ?? request.accessToken,
      },
      url,
      operation,
    );

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
    resourceUrl?: string,
    operation?: OperationDefinition,
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
      const token = await this.getAppAccessToken(
        service,
        resourceUrl,
        operation,
        request.method ?? "GET",
      );
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
      const responseBody = await readResponseBody(response);
      if (isRefreshTokenRejection(response, responseBody)) {
        await this.setUserSession(null);
        throw new Error(USER_SESSION_EXPIRED_MESSAGE);
      }

      throw new Error(formatRefreshFailureMessage(response, responseBody));
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

  private contentScopeMode(): ContentScopeMode {
    return this.config.contentScopeMode ?? DEFAULT_CONTENT_SCOPE_MODE;
  }

  private tokenEndpoint(): string {
    return `${removeTrailingSlash(
      this.config.services?.tokenHost ??
        this.config.services?.oauth2BaseUrl ??
        DEFAULT_BASE_URLS.oauth2,
    )}/oauth2/token`;
  }

  private async getAppAccessToken(
    service: ApiService,
    resourceUrl?: string,
    operation?: OperationDefinition,
    method = "GET",
  ): Promise<string> {
    if (this.mode !== "server") {
      throw new Error(
        "App-authenticated APIs require @quranjs/api/server or a backend.",
      );
    }

    const scopes = this.resolveAppScopes(service, resourceUrl, operation, method);
    if (scopes.length === 0) {
      throw new Error(
        `No client-credentials scope is configured for ${service}.`,
      );
    }

    // Scope order must not create a second cache entry for the same permission set, and one
    // issuer's token is not valid at another. The key therefore covers the token endpoint, the
    // client, the audience and the canonical scope set.
    const scope = this.canonicalizeScopes(scopes);
    const cacheKey = [
      this.tokenEndpoint(),
      this.config.clientId,
      this.config.audience ?? "",
      scope,
    ].join("|");

    const cachedToken = this.appTokens.get(cacheKey);
    if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
      return cachedToken.value;
    }

    const inFlight = this.appTokenRequests.get(cacheKey);
    if (inFlight) {
      return (await inFlight).value;
    }

    const pending = this.fetchAppAccessToken(scope);
    this.appTokenRequests.set(cacheKey, pending);

    try {
      const token = await pending;
      this.appTokens.set(cacheKey, token);
      return token.value;
    } finally {
      if (this.appTokenRequests.get(cacheKey) === pending) {
        this.appTokenRequests.delete(cacheKey);
      }
    }
  }

  private async fetchAppAccessToken(scope: string): Promise<CachedToken> {
    if (!("clientSecret" in this.config)) {
      throw new Error("client_secret is server-only. Use @quranjs/api/server.");
    }

    const clientSecret = this.config.clientSecret;
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope,
    });
    if (this.config.audience) {
      body.set("audience", this.config.audience);
    }

    const response = await retry(
      () =>
        this.getFetch()(this.tokenEndpoint(), {
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
      const responseBody = await readResponseBody(response);
      // invalid_scope means the client was never approved for what was asked. Reporting the
      // requested scopes turns an opaque 400 into something actionable, and retrying with a
      // broader set would be exactly the wrong response.
      if (responseBody.toLowerCase().includes("invalid_scope")) {
        throw new Error(
          `Token request rejected with invalid_scope for "${scope}". Client ` +
            `${this.config.clientId} is not approved for those scopes.` +
            (this.contentScopeMode() === "granular"
              ? ` These credentials may predate the granular content scopes; try contentScopeMode: "legacy".`
              : ` If these credentials were issued with granular content scopes, set contentScopeMode: "granular".`),
        );
      }

      throw new Error(
        `Token request failed: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as TokenResponse;
    const grantedScopes = json.scope
      ? json.scope.split(" ").filter(Boolean)
      : undefined;

    // When the server reports what it granted, check the token can serve this call at all.
    //
    // RFC 6749 section 3.3 lets an authorization server issue a token with a narrower scope than
    // was requested, so a partial grant is legitimate protocol behavior and must not fail here.
    // A grant sharing nothing with the request is different: that token cannot authorize the call
    // it was fetched for, and failing now with the scopes named is far more useful than the
    // confusing 403 it would produce at the API.
    if (grantedScopes) {
      const requested = scope.split(" ");
      const usable = requested.some((requestedScope) =>
        grantedScopes.includes(requestedScope),
      );
      if (!usable) {
        throw new Error(
          `Token was granted "${grantedScopes.join(" ") || "no scopes"}" but none of the ` +
            `requested scopes "${scope}". Check the scopes approved for client ` +
            `${this.config.clientId}.`,
        );
      }
    }

    return {
      expiresAt: Date.now() + json.expires_in * 1000,
      grantedScopes,
      value: json.access_token,
    };
  }

  /** Deduplicate and sort, so scope order never produces a second cache entry. */
  private canonicalizeScopes(scopes: string[]): string {
    return [...new Set(scopes)].sort().join(" ");
  }

  /** Requested scope list for an error message, or a marker when it cannot be determined. */
  private describeRequestedAppScope(
    service: ApiService,
    resourceUrl?: string,
    operation?: OperationDefinition,
    method = "GET",
  ): string {
    try {
      const scopes = this.resolveAppScopes(service, resourceUrl, operation, method);
      return scopes.length > 0 ? this.canonicalizeScopes(scopes) : "none";
    } catch {
      return "unknown";
    }
  }

  /**
   * Scopes to request for an app-authenticated call.
   *
   * In `legacy` mode this reproduces the pre-split behavior exactly, including the special
   * handling of the public QuranReflect reads that are served out of the content spec.
   *
   * In `granular` mode a content call asks for the single scope the operation declares in the
   * pinned catalog. Non-content services are untouched in both modes: `search` and
   * `analytics.events.write` are separately approved permissions and are never requested for a
   * content call.
   */
  private resolveAppScopes(
    service: ApiService,
    resourceUrl?: string,
    operation?: OperationDefinition,
    method = "GET",
  ): string[] {
    if (service !== "content") {
      const serviceScope = APP_SERVICE_SCOPES[service];
      return serviceScope ? [serviceScope] : [];
    }

    if (this.contentScopeMode() === "granular") {
      // A generated raw operation carries its descriptor. The typed convenience facades
      // (client.content.v4.chapters.list() and friends) call fetch() with a plain URL and carry
      // none, so fall back to a deterministic path lookup against the same pinned catalog.
      // Without this, granular mode throws on the documented public API.
      const granular =
        operation?.scopes?.granularAnyOf ??
        (resourceUrl
          ? lookupContentScopes(service, method, new URL(resourceUrl).pathname)
              ?.granularAnyOf
          : undefined) ??
        [];
      if (granular.length > 0) {
        return granular;
      }

      // No blanket fallback. Quietly asking for `content` here would defeat granular mode, and
      // would fail anyway for credentials that were never granted it. Point the caller at the
      // explicit escape hatch instead.
      throw new Error(
        `contentScopeMode is "granular" but no content scope is known for this call` +
          (resourceUrl ? ` (${new URL(resourceUrl).pathname})` : "") +
          `. Call it through a generated operation, or pass an explicit accessToken.`,
      );
    }

    return this.resolveLegacyContentScopes(resourceUrl);
  }

  /** Pre-split content scope selection, behavior preserved exactly. */
  private resolveLegacyContentScopes(resourceUrl?: string): string[] {
    const contentScope = APP_SERVICE_SCOPES.content;
    if (!resourceUrl) {
      return contentScope ? [contentScope] : [];
    }

    const pathname = new URL(resourceUrl).pathname;
    if (!pathname.startsWith(QURAN_REFLECT_POSTS_PATH_PREFIX)) {
      return contentScope ? [contentScope] : [];
    }

    if (
      QURAN_REFLECT_COMMENT_PATH_SUFFIXES.some((suffix) =>
        pathname.endsWith(suffix),
      )
    ) {
      return ["comment.read"];
    }

    return ["post.read"];
  }

  private resolveServiceBaseUrl(
    service: ApiService,
    crossServiceGatewayPath = false,
  ): {
    baseUrl: string;
    usesGateway: boolean;
  } {
    const { services } = this.config;
    if (crossServiceGatewayPath) {
      return {
        baseUrl: removeTrailingSlash(services?.gatewayUrl ?? API_BASE_URL),
        usesGateway: true,
      };
    }

    const directBaseUrl =
      service === "analytics"
        ? services?.analyticsBaseUrl
        : service === "content"
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
    crossServiceGatewayPath = false,
  ): string {
    const normalizedPath = ensureLeadingSlash(normalizePathTemplate(path));
    if (service === "oauth2") {
      return normalizedPath;
    }

    if (crossServiceGatewayPath) {
      return normalizedPath;
    }

    let servicePath = normalizedPath;
    for (const prefix of LEGACY_PREFIXES[service]) {
      if (servicePath.startsWith(prefix)) {
        servicePath = ensureLeadingSlash(servicePath.slice(prefix.length));
        break;
      }
    }

    const prefix = usesGateway
      ? GATEWAY_PATH_PREFIX[service]
      : DIRECT_PATH_PREFIX[service];

    if (servicePath.startsWith(prefix)) {
      return servicePath;
    }

    return `${prefix}${servicePath}`;
  }

  private isCrossServiceGatewayPath(
    service: ApiService,
    path: string,
  ): boolean {
    const normalizedPath = ensureLeadingSlash(normalizePathTemplate(path));
    const pathService = GATEWAY_SERVICES.find((gatewayService) =>
      this.pathMatchesPrefix(
        normalizedPath,
        GATEWAY_PATH_PREFIX[gatewayService],
      ),
    );

    return Boolean(pathService && pathService !== service);
  }

  private pathMatchesPrefix(path: string, prefix: string): boolean {
    return (
      prefix.length > 0 && (path === prefix || path.startsWith(`${prefix}/`))
    );
  }
}
