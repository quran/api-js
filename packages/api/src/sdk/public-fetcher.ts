import type {
  OperationDefinition,
  PublicApiService,
} from "@/generated/public-contracts";
import type {
  ApiParams,
  CustomFetcher,
  OperationRequest,
  PublicClientConfig,
  UserSession,
} from "@/types";
import { prepareBody } from "@/lib/http-utils";
import {
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

export class PublicQuranFetcher {
  private userSession: UserSession | null | undefined;

  constructor(private readonly config: PublicClientConfig) {
    this.userSession = config.userSession;
  }

  public clearCachedTokens(): void {
    return;
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
    service: PublicApiService,
    path: string,
    query?: ApiParams,
  ): string {
    const { baseUrl, usesGateway } = this.resolveServiceBaseUrl(service);
    const servicePath = this.normalizeServicePath(service, path, usesGateway);
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
        method:
          request?.method ??
          (operation.method.toUpperCase() as OperationRequest["method"]),
        path: undefined,
      },
    );
  }

  public async request<T = unknown>(
    service: PublicApiService,
    path: string,
    query?: ApiParams,
    request: OperationRequest = {},
  ): Promise<T> {
    if (request.basicAuth) {
      throw new Error("client_secret is server-only. Use @quranjs/api/server.");
    }

    const effectiveAuth = this.resolveAuthMode(service, request.auth);
    const url = this.buildServiceUrl(service, path, query);
    const headers = new Headers(request.headers);
    const body = prepareBody(request, headers);

    if (service !== "oauth2") {
      headers.set("x-client-id", this.config.clientId);
    }

    await this.applyAuthenticationHeaders(
      service,
      effectiveAuth,
      headers,
      request,
    );

    const response = await this.getFetch()(url, {
      body,
      headers,
      method: request.method ?? "GET",
    });

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

  private resolveAuthMode(
    service: PublicApiService,
    auth: OperationRequest["auth"] = "auto",
  ): "none" | "user" {
    if (auth !== "auto") {
      if (auth === "app") {
        throw new Error(
          "This API requires @quranjs/api/server or a backend. Content and search are server-side for confidential clients.",
        );
      }

      return auth;
    }

    if (service === "auth" || service === "quranReflect") {
      return "user";
    }

    return "none";
  }

  private async applyAuthenticationHeaders(
    service: PublicApiService,
    auth: "none" | "user",
    headers: Headers,
    request: OperationRequest,
  ): Promise<void> {
    if (request.accessToken) {
      this.setTokenHeaders(service, headers, request.accessToken);
      return;
    }

    if (auth === "none") {
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

  private setTokenHeaders(
    service: PublicApiService,
    headers: Headers,
    accessToken: string,
  ): void {
    if (service === "oauth2") {
      headers.set("Authorization", `Bearer ${accessToken}`);
      return;
    }

    headers.set("x-auth-token", accessToken);
  }

  private resolveServiceBaseUrl(service: PublicApiService): {
    baseUrl: string;
    usesGateway: boolean;
  } {
    const { services } = this.config;
    const directBaseUrl =
      service === "auth"
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
    service: PublicApiService,
    path: string,
    usesGateway: boolean,
  ): string {
    let normalizedPath = ensureLeadingSlash(normalizePathTemplate(path));
    for (const legacyPrefix of LEGACY_PREFIXES[service]) {
      if (normalizedPath.startsWith(legacyPrefix)) {
        normalizedPath = ensureLeadingSlash(
          normalizedPath.slice(legacyPrefix.length),
        );
        break;
      }
    }

    const prefix = usesGateway
      ? GATEWAY_PATH_PREFIX[service]
      : DIRECT_PATH_PREFIX[service];

    if (normalizedPath.startsWith(prefix) || prefix.length === 0) {
      return normalizedPath;
    }

    return `${prefix}${normalizedPath}`;
  }
}
