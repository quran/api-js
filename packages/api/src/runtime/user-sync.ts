import type {
  ApiParams,
  HTTPMethod,
  OperationRequest,
  UserSyncFacade,
  UserSyncGetMutationsOptions,
  UserSyncMutation,
  UserSyncMutationsPage,
  UserSyncPullAllMutationsOptions,
  UserSyncPushMutationsOptions,
  UserSyncPushMutationsResult,
  UserSyncResponse,
  UserSyncSuccess,
} from "@/types";
import { QuranHttpError } from "@/sdk/http-error";
import {
  UserSyncPullRestartLimitError,
  withUserSyncErrorDetails,
} from "@/sdk/user-sync-errors";

interface UserSyncFetcher {
  request<T>(
    service: "auth",
    path: string,
    query?: ApiParams,
    request?: OperationRequest,
  ): Promise<T>;
}

const SYNC_PATH = "/v1/sync";
const MAX_MUTATIONS_PER_REQUEST = 100;
const DEFAULT_MAX_RESTARTS = 2;

const parseMutationAt = (value: string | null): number | null => {
  if (value === null || !/^-?\d+$/.test(value.trim())) {
    return null;
  }

  return Number(value.trim());
};

const toGetQuery = (options: UserSyncGetMutationsOptions): ApiParams => ({
  lastMutationAt: options.lastMutationAt,
  limit: options.limit,
  metadataOnly: options.metadataOnly,
  mutationsSince: options.mutationsSince,
  page: options.page,
  resources:
    options.resources === undefined || options.resources.length === 0
      ? undefined
      : options.resources.join(","),
});

const isLaterPageConflict = (error: unknown): boolean =>
  error instanceof QuranHttpError && error.status === 409;

export const createUserSyncFacade = (
  fetcher: UserSyncFetcher,
): UserSyncFacade => {
  const requestWithMutationAt = async <T>(
    method: HTTPMethod,
    query: ApiParams,
    options: OperationRequest = {},
  ): Promise<UserSyncResponse<T>> => {
    let mutationAt: number | null = null;
    let status = 0;
    const body = await fetcher
      .request<UserSyncSuccess<T>>("auth", SYNC_PATH, query, {
        ...options,
        auth: "user",
        method,
        onResponse: (metadata) => {
          mutationAt = parseMutationAt(metadata.headers.get("x-mutation-at"));
          status = metadata.status;
        },
        preserveResponseKeys: true,
      })
      .catch((error: unknown) => {
        throw withUserSyncErrorDetails(error);
      });

    return { ...body, mutationAt, status };
  };

  const getMutations = (options: UserSyncGetMutationsOptions) =>
    requestWithMutationAt<UserSyncMutationsPage>("GET", toGetQuery(options));

  const pushMutations = async (options: UserSyncPushMutationsOptions) => {
    if (options.mutations.length > MAX_MUTATIONS_PER_REQUEST) {
      throw new Error(
        `User Sync accepts at most ${MAX_MUTATIONS_PER_REQUEST} mutations per request; received ${options.mutations.length}.`,
      );
    }

    // Snapshot the inputs so caller changes during an awaited request cannot
    // alter what is sent.
    const lastMutationAt = options.lastMutationAt;
    const mutations = JSON.parse(
      JSON.stringify(options.mutations),
    ) as unknown[];

    return requestWithMutationAt<UserSyncPushMutationsResult>(
      "POST",
      { lastMutationAt },
      { body: { mutations } },
    );
  };

  const pullAllMutations = async ({
    maxRestarts = DEFAULT_MAX_RESTARTS,
    ...options
  }: UserSyncPullAllMutationsOptions) => {
    if (!Number.isInteger(maxRestarts) || maxRestarts < 0) {
      throw new Error("maxRestarts must be a non-negative integer.");
    }

    // Every pass reuses the original cursor, resources and limit.
    const baseOptions: UserSyncGetMutationsOptions = {
      limit: options.limit,
      mutationsSince: options.mutationsSince,
      resources:
        options.resources === undefined ? undefined : [...options.resources],
    };
    let restarts = 0;

    for (;;) {
      const mutations: UserSyncMutation[] = [];
      let page = 1;
      let head: number | undefined;

      try {
        for (;;) {
          const response = await getMutations({
            ...baseOptions,
            ...(page === 1 ? {} : { lastMutationAt: head }),
            page,
          });
          const data = response.data;
          const pageMutations = data.mutations ?? [];

          if (page === 1) {
            head = data.lastMutationAt;
          }
          mutations.push(...pageMutations);

          if (data.hasMore !== true) {
            return {
              lastMutationAt: head!,
              mutations,
              pages: page,
              restarts,
            };
          }

          if (pageMutations.length === 0) {
            throw new Error(
              `User Sync page ${page} reported hasMore without returning mutations.`,
            );
          }
          page += 1;
        }
      } catch (error) {
        // Only a later-page 409 means the continuation head moved.
        if (page === 1 || !isLaterPageConflict(error)) {
          throw error;
        }

        if (restarts >= maxRestarts) {
          throw new UserSyncPullRestartLimitError(restarts, error);
        }
        restarts += 1;
      }
    }
  };

  return { getMutations, pullAllMutations, pushMutations };
};
