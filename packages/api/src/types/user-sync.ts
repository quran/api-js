/** Resources tracked by the User Sync API (`/v1/sync`). */
export type UserSyncResource =
  | "BOOKMARK"
  | "COLLECTION"
  | "COLLECTION_BOOKMARK"
  | "NOTE"
  | "READING_BOOKMARK"
  | "READING_SESSION";

export type UserSyncMutationType = "CREATE" | "DELETE" | "UPDATE";

/** Resource data. Its shape depends on the mutation's resource. */
export type UserSyncMutationData = Record<string, unknown>;

/** A mutation returned by `GET /v1/sync` or applied by `POST /v1/sync`. */
export interface UserSyncMutation {
  /** Latest data for the resource. Delete mutations usually carry empty data. */
  data?: UserSyncMutationData;
  resource: UserSyncResource;
  /**
   * Server resource ID. Omitted in GET responses for composite-key resources
   * such as COLLECTION_BOOKMARK; POST responses may return a composite ID.
   */
  resourceId?: string;
  /** Server sync mutation timestamp in Unix milliseconds. */
  timestamp: number;
  type: UserSyncMutationType;
}

/** A local mutation sent to `POST /v1/sync`. */
export interface UserSyncMutationInput {
  data?: UserSyncMutationData;
  resource: UserSyncResource;
  /**
   * Server resource ID for UPDATE and DELETE. Omit it for COLLECTION_BOOKMARK,
   * which is identified by `data.collectionId` plus bookmark details.
   */
  resourceId?: string;
  type: UserSyncMutationType;
}

export interface UserSyncGetMutationsOptions {
  /** Pull cursor in Unix milliseconds. Required, even with `metadataOnly`. */
  mutationsSince: number;
  /**
   * For page > 1, the `lastMutationAt` returned by page 1. Never pass an
   * `X-Mutation-At` header value here.
   */
  lastMutationAt?: number;
  /** Return only `lastMutationAt`, without mutations or pagination fields. */
  metadataOnly?: boolean;
  /** Mutations per page, an integer from 1 to 1000. The server default is 100. */
  limit?: number;
  /** 1-based page number. */
  page?: number;
  /** Resources to include. Omit to receive every resource the token can read. */
  resources?: readonly UserSyncResource[];
}

export interface UserSyncMutationsPage {
  hasMore?: boolean;
  /** Effective sync head. The only field returned when `metadataOnly` is true. */
  lastMutationAt: number;
  limit?: number;
  mutations?: UserSyncMutation[];
  page?: number;
  total?: number;
}

export interface UserSyncPushMutationsOptions {
  /**
   * The latest sync head returned by `GET /v1/sync` (or by the previous
   * successful push), sent unchanged. A stale value returns 409 OutOfSyncError.
   */
  lastMutationAt: number;
  /** Mutations to apply, at most 100 per request. */
  mutations: readonly UserSyncMutationInput[];
}

export interface UserSyncPushMutationsResult {
  /** Effective sync head after applying the mutations. */
  lastMutationAt: number;
  /** Mutations that were applied, with server IDs and timestamps. */
  mutations: UserSyncMutation[];
}

export interface UserSyncSuccess<T> {
  data: T;
  success: true;
}

export type UserSyncResponse<T> = UserSyncSuccess<T> & {
  /**
   * The `X-Mutation-At` response header in Unix milliseconds, or null when it
   * is absent or not numeric. It is an optimistic write precondition for the
   * next push, never a pull cursor.
   */
  mutationAt: number | null;
  status: number;
};

export type UserSyncPullAllMutationsOptions = Omit<
  UserSyncGetMutationsOptions,
  "lastMutationAt" | "metadataOnly" | "page"
> & {
  /**
   * How many times to restart from page 1 after a 409 on a later page before
   * throwing `UserSyncPullRestartLimitError`. Defaults to 2.
   */
  maxRestarts?: number;
};

export interface UserSyncPullAllMutationsResult {
  /**
   * The pull cursor to persist. Use it as the next `mutationsSince` only after
   * applying every returned mutation.
   */
  lastMutationAt: number;
  mutations: UserSyncMutation[];
  /** Number of pages fetched in the successful pass. */
  pages: number;
  /** Number of restarts from page 1 caused by a later-page 409. */
  restarts: number;
}

/** Typed methods for `GET /v1/sync` and `POST /v1/sync`, plus a pull helper. */
export interface UserSyncFacade {
  getMutations(
    options: UserSyncGetMutationsOptions,
  ): Promise<UserSyncResponse<UserSyncMutationsPage>>;
  pullAllMutations(
    options: UserSyncPullAllMutationsOptions,
  ): Promise<UserSyncPullAllMutationsResult>;
  pushMutations(
    options: UserSyncPushMutationsOptions,
  ): Promise<UserSyncResponse<UserSyncPushMutationsResult>>;
}
