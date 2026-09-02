import type {
  AppStateAccountState,
  AppStateChange,
  AppStateMutationOptions,
  AppStatePendingMutation,
  AppStatePendingPut,
  AppStatePutBody,
  AppStateReconciler,
  AppStateReconcilerOptions,
  AppStateResponse,
  AppStateStateView,
  AppStateStoredDocument,
} from "@/types";
import { getAppStateErrorCode } from "@/sdk/app-state-errors";

import {
  applyAppStateBootstrapPage,
  applyAppStateChangePage,
  appStateDocumentId,
  AppStateProtocolError,
  deriveAppStateStateView,
  promoteAppStateBootstrap,
  queueAppStateDelete,
  queueAppStatePut,
  removeAppStateMutation,
  replaceAppStateMutation,
  snapshotAppStateMutations,
} from "./app-state-state";

interface ReconcileContext {
  accountId: string;
  generation: number;
}

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_BOOTSTRAP_RESTART_ATTEMPTS = 3;
const DEFAULT_MAX_REBASE_ATTEMPTS = 3;

const defaultIdempotencyKey = (): string => {
  const runtimeCrypto = (
    globalThis as { crypto?: { randomUUID?: () => string } }
  ).crypto;
  if (typeof runtimeCrypto?.randomUUID !== "function") {
    throw new Error(
      "App State reconciliation requires createIdempotencyKey when crypto.randomUUID is unavailable.",
    );
  }
  return runtimeCrypto.randomUUID();
};

const mutationOptions = (
  mutation: AppStatePendingMutation,
): AppStateMutationOptions => {
  if (mutation.ifMatch !== undefined) {
    return {
      idempotencyKey: mutation.idempotencyKey,
      ifMatch: mutation.ifMatch,
    };
  }
  if (mutation.ifNoneMatch !== undefined) {
    return {
      idempotencyKey: mutation.idempotencyKey,
      ifNoneMatch: mutation.ifNoneMatch,
    };
  }
  return { idempotencyKey: mutation.idempotencyKey };
};

const bootstrapItems = (
  items: readonly Omit<AppStateStoredDocument, "operation">[],
): AppStateStoredDocument[] =>
  items.map((item) => ({ ...item, operation: "upsert" }));

const isRecoveryError = (error: unknown): boolean => {
  const code = getAppStateErrorCode(error);
  return code === "bootstrap_required" || code === "sync_token_expired";
};

const positiveInteger = (value: number, name: string): number => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer.`);
  }
  return value;
};

export const createAppStateReconciler = ({
  accountId: initialAccountId,
  createIdempotencyKey = defaultIdempotencyKey,
  maxRebaseAttempts = DEFAULT_MAX_REBASE_ATTEMPTS,
  pageSize = DEFAULT_PAGE_SIZE,
  store,
  transport,
}: AppStateReconcilerOptions): AppStateReconciler => {
  if (!initialAccountId) {
    throw new TypeError("App State reconciliation requires an account ID.");
  }
  positiveInteger(pageSize, "pageSize");
  if (!Number.isInteger(maxRebaseAttempts) || maxRebaseAttempts < 0) {
    throw new TypeError("maxRebaseAttempts must be a non-negative integer.");
  }

  let activeAccountId = initialAccountId;
  let accountGeneration = 0;
  let reconcileQueue = Promise.resolve();

  const isCurrent = (context: ReconcileContext): boolean =>
    context.accountId === activeAccountId &&
    context.generation === accountGeneration;

  const context = (): ReconcileContext => ({
    accountId: activeAccountId,
    generation: accountGeneration,
  });

  const commit = async (
    reconcileContext: ReconcileContext,
    reducer: (state: AppStateAccountState) => void,
  ): Promise<boolean> => {
    if (!isCurrent(reconcileContext)) return false;
    return store.transaction(reconcileContext.accountId, (state) => {
      if (!isCurrent(reconcileContext)) return false;
      reducer(state);
      return true;
    });
  };

  const readProgress = (reconcileContext: ReconcileContext) =>
    store.transaction(reconcileContext.accountId, (state) => ({
      bootstrapCursor: state.bootstrapCursor,
      hasStaging: state.stagingBootstrap !== null,
      syncToken: state.syncToken,
    }));

  const resetBootstrap = (
    reconcileContext: ReconcileContext,
  ): Promise<boolean> =>
    commit(reconcileContext, (state) => {
      state.bootstrapCursor = null;
      state.stagingBootstrap = {};
      state.syncToken = null;
    });

  const rebuildBootstrap = async (
    reconcileContext: ReconcileContext,
    reset: boolean,
  ): Promise<void> => {
    let restartAttempts = 0;
    if (reset && !(await resetBootstrap(reconcileContext))) return;

    while (isCurrent(reconcileContext)) {
      while (isCurrent(reconcileContext)) {
        const progress = await readProgress(reconcileContext);
        if (!isCurrent(reconcileContext)) return;
        if (
          progress.hasStaging &&
          progress.bootstrapCursor === null &&
          progress.syncToken !== null
        ) {
          break;
        }

        let response: Awaited<ReturnType<typeof transport.bootstrap>>;
        try {
          response = await transport.bootstrap({
            ...(progress.bootstrapCursor === null
              ? {}
              : { cursor: progress.bootstrapCursor }),
            limit: pageSize,
          });
        } catch (error) {
          if (!isCurrent(reconcileContext)) return;
          throw error;
        }
        if (!isCurrent(reconcileContext)) return;

        const page = response.data;
        if (page.hasMore && page.nextCursor === null) {
          throw new AppStateProtocolError("bootstrap_cursor_missing");
        }
        if (!page.hasMore && page.nextSyncToken === null) {
          throw new AppStateProtocolError("bootstrap_sync_token_missing");
        }
        const pageCommitted = await commit(reconcileContext, (state) => {
          applyAppStateBootstrapPage(
            state,
            bootstrapItems(page.items),
            page.hasMore ? page.nextCursor : null,
          );
          if (!page.hasMore) {
            state.syncToken = page.nextSyncToken;
          }
        });
        if (!pageCommitted) return;
        if (!page.hasMore) break;
      }

      while (isCurrent(reconcileContext)) {
        const { syncToken } = await readProgress(reconcileContext);
        if (!isCurrent(reconcileContext)) return;
        if (syncToken === null) {
          throw new AppStateProtocolError("bootstrap_sync_token_missing");
        }
        let response: Awaited<ReturnType<typeof transport.getChanges>>;
        try {
          response = await transport.getChanges(syncToken, {
            limit: pageSize,
          });
        } catch (error) {
          if (!isCurrent(reconcileContext)) return;
          if (!isRecoveryError(error)) throw error;
          const resetCommitted = await resetBootstrap(reconcileContext);
          if (!resetCommitted) return;
          if (
            restartAttempts >= DEFAULT_MAX_BOOTSTRAP_RESTART_ATTEMPTS
          ) {
            throw error;
          }
          restartAttempts += 1;
          break;
        }
        if (!isCurrent(reconcileContext)) return;

        const pageCommitted = await commit(reconcileContext, (state) => {
          applyAppStateChangePage(
            state,
            response.data.changes,
            response.data.nextSyncToken,
            "stagingBootstrap",
          );
          if (!response.data.hasMore) {
            promoteAppStateBootstrap(state);
          }
        });
        if (!pageCommitted || !response.data.hasMore) return;
      }
    }
  };

  const pull = async (reconcileContext: ReconcileContext): Promise<void> => {
    const initial = await readProgress(reconcileContext);
    if (!isCurrent(reconcileContext)) return;
    if (initial.syncToken === null || initial.hasStaging) {
      await rebuildBootstrap(reconcileContext, false);
      return;
    }

    while (isCurrent(reconcileContext)) {
      const { syncToken } = await readProgress(reconcileContext);
      if (!isCurrent(reconcileContext)) return;
      if (syncToken === null) {
        await rebuildBootstrap(reconcileContext, false);
        return;
      }

      try {
        const response = await transport.getChanges(syncToken, {
          limit: pageSize,
        });
        if (!isCurrent(reconcileContext)) return;
        const pageCommitted = await commit(reconcileContext, (state) => {
          applyAppStateChangePage(
            state,
            response.data.changes,
            response.data.nextSyncToken,
          );
        });
        if (!pageCommitted || !response.data.hasMore) return;
      } catch (error) {
        if (!isCurrent(reconcileContext)) return;
        if (!isRecoveryError(error)) throw error;
        await rebuildBootstrap(reconcileContext, true);
        return;
      }
    }
  };

  const applySuccessfulPut = async (
    reconcileContext: ReconcileContext,
    mutation: AppStatePendingPut,
    response: AppStateResponse<{
      collection: string;
      key: string;
      schemaVersion: number;
      updatedAt: string;
      version: number;
    }>,
  ): Promise<void> => {
    const etag = response.etag;
    if (etag === null) {
      throw new AppStateProtocolError("put_response_etag_missing");
    }
    await commit(reconcileContext, (state) => {
      if (state.syncToken !== null) {
        const change: AppStateChange = {
          ...response.data,
          etag,
          operation: "upsert",
          value: mutation.body.value,
        };
        applyAppStateChangePage(state, [change], state.syncToken);
      }
      removeAppStateMutation(state, mutation.localRevision);
    });
  };

  const acknowledgeDelete = async (
    reconcileContext: ReconcileContext,
    mutation: AppStatePendingMutation,
  ): Promise<void> => {
    await commit(reconcileContext, (state) => {
      const id = appStateDocumentId(mutation.collection, mutation.key);
      const current = state.shadow[id];
      if (current) {
        state.shadow[id] = { ...current, operation: "delete", value: null };
      }
      removeAppStateMutation(state, mutation.localRevision);
    });
  };

  const refreshAndRebase = async (
    reconcileContext: ReconcileContext,
    mutation: AppStatePendingMutation,
  ): Promise<AppStatePendingMutation | null> => {
    let current: Awaited<ReturnType<typeof transport.getDocument>> | null;
    try {
      current = await transport.getDocument(mutation.collection, mutation.key);
    } catch (error) {
      if (getAppStateErrorCode(error) !== "document_not_found") throw error;
      current = null;
    }
    if (!isCurrent(reconcileContext)) return null;
    if (current !== null && current.etag === null) {
      throw new Error("App State conflict refresh did not return an ETag.");
    }

    if (current === null && mutation.method === "DELETE") {
      await acknowledgeDelete(reconcileContext, mutation);
      return null;
    }

    const rebased: AppStatePendingMutation =
      mutation.method === "PUT"
        ? {
            body: mutation.body,
            collection: mutation.collection,
            idempotencyKey: createIdempotencyKey(),
            ...(current === null
              ? { ifNoneMatch: "*" }
              : { ifMatch: current.etag! }),
            key: mutation.key,
            localRevision: mutation.localRevision,
            method: "PUT",
          }
        : {
            collection: mutation.collection,
            idempotencyKey: createIdempotencyKey(),
            ifMatch: current!.etag!,
            key: mutation.key,
            localRevision: mutation.localRevision,
            method: "DELETE",
          };

    const committed = await commit(reconcileContext, (state) => {
      if (current !== null && state.syncToken !== null) {
        applyAppStateChangePage(
          state,
          [
            {
              ...current.data,
              etag: current.etag!,
              operation: "upsert",
            },
          ],
          state.syncToken,
        );
      }
      replaceAppStateMutation(state, rebased);
    });
    return committed ? rebased : null;
  };

  const replayMutation = async (
    reconcileContext: ReconcileContext,
    captured: AppStatePendingMutation,
  ): Promise<void> => {
    let mutation = captured;
    let rebaseAttempts = 0;

    while (isCurrent(reconcileContext)) {
      try {
        if (mutation.method === "PUT") {
          const response = await transport.putDocument(
            mutation.collection,
            mutation.key,
            mutation.body,
            mutationOptions(mutation),
          );
          if (!isCurrent(reconcileContext)) return;
          await applySuccessfulPut(reconcileContext, mutation, response);
        } else {
          await transport.deleteDocument(
            mutation.collection,
            mutation.key,
            mutationOptions(mutation),
          );
          if (!isCurrent(reconcileContext)) return;
          await acknowledgeDelete(reconcileContext, mutation);
        }
        return;
      } catch (error) {
        if (!isCurrent(reconcileContext)) return;
        const errorCode = getAppStateErrorCode(error);
        if (
          mutation.method === "DELETE" &&
          errorCode === "document_not_found"
        ) {
          await acknowledgeDelete(reconcileContext, mutation);
          return;
        }
        if (
          errorCode !== "precondition_failed" ||
          rebaseAttempts >= maxRebaseAttempts
        ) {
          throw error;
        }
        rebaseAttempts += 1;
        const rebased = await refreshAndRebase(reconcileContext, mutation);
        if (rebased === null) return;
        mutation = rebased;
      }
    }
  };

  const replay = async (reconcileContext: ReconcileContext): Promise<void> => {
    const captured = await store.transaction(
      reconcileContext.accountId,
      snapshotAppStateMutations,
    );
    for (const mutation of captured) {
      if (!isCurrent(reconcileContext)) return;
      await replayMutation(reconcileContext, mutation);
    }
  };

  const reconcileContext = async (
    reconcileContext: ReconcileContext,
  ): Promise<void> => {
    await pull(reconcileContext);
    if (!isCurrent(reconcileContext)) return;
    try {
      await replay(reconcileContext);
    } catch (error) {
      if (!isRecoveryError(error)) throw error;
      await rebuildBootstrap(reconcileContext, true);
      if (!isCurrent(reconcileContext)) return;
      await replay(reconcileContext);
    }
    if (!isCurrent(reconcileContext)) return;
    await pull(reconcileContext);
  };

  const getStateFor = (accountId: string): Promise<AppStateStateView> =>
    store.transaction(accountId, deriveAppStateStateView);

  return {
    deleteDocument: async (collection, key) => {
      const mutationContext = context();
      const idempotencyKey = createIdempotencyKey();
      await store.transaction(mutationContext.accountId, (state) => {
        queueAppStateDelete(state, collection, key, idempotencyKey);
      });
      return getStateFor(activeAccountId);
    },
    getState: () => getStateFor(activeAccountId),
    putDocument: async (collection, key, body: AppStatePutBody) => {
      const mutationContext = context();
      const idempotencyKey = createIdempotencyKey();
      await store.transaction(mutationContext.accountId, (state) => {
        queueAppStatePut(state, collection, key, body, idempotencyKey);
      });
      return getStateFor(activeAccountId);
    },
    reconcile: () => {
      const capturedContext = context();
      const operation = reconcileQueue.then(() =>
        reconcileContext(capturedContext),
      );
      reconcileQueue = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation.then(() => getStateFor(activeAccountId));
    },
    switchAccount: (accountId) => {
      if (!accountId) {
        return Promise.reject(
          new TypeError("App State reconciliation requires an account ID."),
        );
      }
      accountGeneration += 1;
      activeAccountId = accountId;
      return getStateFor(accountId);
    },
  };
};
