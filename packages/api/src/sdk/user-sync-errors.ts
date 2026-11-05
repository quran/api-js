import { QuranHttpError } from "./http-error";

const USER_SYNC_OUT_OF_SYNC_ERROR_CODE = "OutOfSyncError";

interface UserSyncServiceError {
  code: string;
  details?: Record<string, unknown>;
  message?: string;
}

/**
 * 409 body for a stale `lastMutationAt`. The public Gateway nests the backend
 * envelope in `details`; direct backend calls return that envelope unwrapped.
 */
export type UserSyncOutOfSyncErrorPayload =
  | {
      details: { error: UserSyncServiceError; success: false };
      message: string;
      success: false;
      type: string;
    }
  | { error: UserSyncServiceError; success: false };

export type UserSyncOutOfSyncError = QuranHttpError & {
  /** Set on errors thrown by the User Sync facade. */
  readonly code?: typeof USER_SYNC_OUT_OF_SYNC_ERROR_CODE;
  readonly payload: UserSyncOutOfSyncErrorPayload;
  readonly status: 409;
};

const readServiceErrorCode = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const serviceError = (value as { error?: unknown }).error;
  if (typeof serviceError !== "object" || serviceError === null) {
    return undefined;
  }

  const code = (serviceError as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
};

const readServiceError = (
  value: unknown,
): { code?: string; message?: string } | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const serviceError = (value as { error?: unknown }).error;
  if (typeof serviceError !== "object" || serviceError === null) {
    return undefined;
  }

  const { code, message } = serviceError as {
    code?: unknown;
    message?: unknown;
  };
  return {
    code: typeof code === "string" ? code : undefined,
    message: typeof message === "string" && message ? message : undefined,
  };
};

const DEFAULT_OUT_OF_SYNC_MESSAGE =
  "Out of sync: lastMutationAt is stale; pull and retry.";

/**
 * Gives a User Sync `QuranHttpError` the service's error code and message.
 *
 * The shared HTTP error message is only `"<status> <statusText>"`, which is
 * `"409 "` over HTTP/2, so the server's reason is otherwise lost. The error is
 * updated in place, so `instanceof`, `status`, `headers` and `payload` stay as
 * they were. Both the Gateway envelope (service error in `details.error`) and
 * the direct backend envelope (service error in `error`) are read.
 */
export const withUserSyncErrorDetails = (error: unknown): unknown => {
  if (!(error instanceof QuranHttpError)) {
    return error;
  }

  const payload = error.payload;
  if (typeof payload !== "object" || payload === null) {
    return error;
  }

  const wrapped = readServiceError((payload as { details?: unknown }).details);
  const direct = readServiceError(payload);
  const code = wrapped?.code ?? direct?.code;
  if (code === undefined) {
    return error;
  }

  const topLevelMessage = (payload as { message?: unknown }).message;
  const message =
    wrapped?.message ??
    direct?.message ??
    (typeof topLevelMessage === "string" && topLevelMessage
      ? topLevelMessage
      : undefined) ??
    (isUserSyncOutOfSyncError(error) ? DEFAULT_OUT_OF_SYNC_MESSAGE : undefined);

  Object.defineProperty(error, "code", {
    configurable: true,
    enumerable: true,
    value: code,
    writable: true,
  });
  if (message !== undefined) {
    error.message = `${error.message.trimEnd()}: ${message}`;
  }
  return error;
};

/** Returns true for a 409 `OutOfSyncError` from `GET` or `POST /v1/sync`. */
export const isUserSyncOutOfSyncError = (
  error: unknown,
): error is UserSyncOutOfSyncError => {
  if (!(error instanceof QuranHttpError) || error.status !== 409) {
    return false;
  }

  const payload = error.payload;
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const code =
    readServiceErrorCode((payload as { details?: unknown }).details) ??
    readServiceErrorCode(payload);
  return code === USER_SYNC_OUT_OF_SYNC_ERROR_CODE;
};

/**
 * Thrown by `pullAllMutations()` when later pages keep returning 409 after the
 * allowed number of restarts from page 1. `cause` holds the last 409 error.
 */
export class UserSyncPullRestartLimitError extends Error {
  public readonly restarts: number;

  public constructor(restarts: number, cause: unknown) {
    super(
      `User Sync pull restarted ${restarts} time(s) after later-page 409 responses and gave up.`,
      { cause },
    );
    this.name = "UserSyncPullRestartLimitError";
    this.restarts = restarts;
  }
}
