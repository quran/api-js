import { QuranHttpError } from "./http-error";

export type AppStateErrorCode =
  | "app_state_data_deleted"
  | "app_state_disabled"
  | "app_state_policy_changed"
  | "bootstrap_required"
  | "collection_not_allowed"
  | "document_not_found"
  | "idempotency_key_reused"
  | "insufficient_scope"
  | "invalid_etag"
  | "invalid_json"
  | "invalid_key"
  | "invalid_sync_token"
  | "precondition_failed"
  | "precondition_required"
  | "sync_token_expired";

export interface AppStateErrorPayload {
  details: {
    currentETag?: string | null;
    error: AppStateErrorCode;
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
  "bootstrap_required",
  "collection_not_allowed",
  "document_not_found",
  "idempotency_key_reused",
  "insufficient_scope",
  "invalid_etag",
  "invalid_json",
  "invalid_key",
  "invalid_sync_token",
  "precondition_failed",
  "precondition_required",
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

  const code = (details as { error?: unknown }).error;
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
