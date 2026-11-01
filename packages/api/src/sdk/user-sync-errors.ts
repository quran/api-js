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
