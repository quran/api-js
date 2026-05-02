import type { OperationRequest, TokenResponse, UserSession } from "@/types";

export const encodeBasicAuth = (username: string, password: string): string => {
  const raw = `${username}:${password}`;

  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw).toString("base64");
  }

  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(raw);
  }

  throw new Error("No base64 encoder available for HTTP basic auth.");
};

export const prepareBody = (
  request: OperationRequest,
  headers: Headers,
): string | URLSearchParams | undefined => {
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
};

export const toUserSession = (
  token: TokenResponse & {
    accessToken?: string;
    expiresIn?: number;
    idToken?: string;
    refreshToken?: string;
    tokenType?: string;
  },
  currentSession?: Partial<UserSession> | null,
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
