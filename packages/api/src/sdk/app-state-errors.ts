import { QuranHttpError } from "./http-error";

export type AppStateErrorCode =
  | "app_state_data_deleted"
  | "app_state_disabled"
  | "app_state_policy_changed"
  | "app_state_unavailable"
  | "bootstrap_required"
  | "collection_not_allowed"
  | "document_not_found"
  | "document_too_large"
  | "idempotency_key_reused"
  | "internal_server_error"
  | "insufficient_scope"
  | "invalid_collection"
  | "invalid_etag"
  | "invalid_idempotency_key"
  | "invalid_json"
  | "invalid_key"
  | "invalid_precondition"
  | "invalid_sync_token"
  | "invalid_token"
  | "namespace_resolution_unavailable"
  | "payload_too_large"
  | "precondition_failed"
  | "precondition_required"
  | "quota_exceeded"
  | "rate_limit_exceeded"
  | "sync_token_expired";

export interface AppStateServiceError {
  code: AppStateErrorCode;
  details?: {
    currentETag?: string | null;
    [key: string]: unknown;
  };
  message?: string;
  [key: string]: unknown;
}

export interface AppStateErrorPayload {
  details: {
    currentETag?: string | null;
    error: AppStateErrorCode | AppStateServiceError;
    [key: string]: unknown;
  };
  message: string;
  success: false;
  type: string;
}

export type AppStateHttpError = QuranHttpError & {
  readonly payload: AppStateErrorPayload;
};

const APP_STATE_ERROR_CODES: ReadonlySet<string> = new Set<AppStateErrorCode>([
  "app_state_data_deleted",
  "app_state_disabled",
  "app_state_policy_changed",
  "app_state_unavailable",
  "bootstrap_required",
  "collection_not_allowed",
  "document_not_found",
  "document_too_large",
  "idempotency_key_reused",
  "internal_server_error",
  "insufficient_scope",
  "invalid_collection",
  "invalid_etag",
  "invalid_idempotency_key",
  "invalid_json",
  "invalid_key",
  "invalid_precondition",
  "invalid_sync_token",
  "invalid_token",
  "namespace_resolution_unavailable",
  "payload_too_large",
  "precondition_failed",
  "precondition_required",
  "quota_exceeded",
  "rate_limit_exceeded",
  "sync_token_expired",
]);

export const getAppStateErrorCode = (
  error: unknown,
): AppStateErrorCode | undefined => {
  if (!(error instanceof QuranHttpError)) {
    return undefined;
  }

  const payload = error.payload;
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const details = (payload as { details?: unknown }).details;
  if (typeof details !== "object" || details === null) {
    return undefined;
  }

  const serviceError = (details as { error?: unknown }).error;
  const code =
    typeof serviceError === "string"
      ? serviceError
      : typeof serviceError === "object" && serviceError !== null
        ? (serviceError as { code?: unknown }).code
        : undefined;
  return typeof code === "string" && APP_STATE_ERROR_CODES.has(code)
    ? (code as AppStateErrorCode)
    : undefined;
};

export function isAppStateHttpError(
  error: unknown,
  code?: AppStateErrorCode,
): error is AppStateHttpError {
  const actualCode = getAppStateErrorCode(error);
  return (
    actualCode !== undefined && (code === undefined || code === actualCode)
  );
}
