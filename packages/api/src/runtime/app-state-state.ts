import type {
  AppStateAccountState,
  AppStateChange,
  AppStatePendingMutation,
  AppStatePendingPut,
  AppStatePutBody,
  AppStateStateView,
  AppStateStore,
  AppStateStoredDocument,
  AppStateStoreReducer,
  AppStateVisibleDocument,
} from "@/types";

export type AppStateProtocolErrorCode =
  | "bootstrap_cursor_missing"
  | "bootstrap_sync_token_missing"
  | "same_version_conflict";

export class AppStateProtocolError extends Error {
  public readonly code: AppStateProtocolErrorCode;

  public constructor(code: AppStateProtocolErrorCode) {
    super(`App State reconciliation protocol error: ${code}`);
    this.name = "AppStateProtocolError";
    this.code = code;
  }
}

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }
  return Object.freeze(value);
};

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const appStateDocumentId = (collection: string, key: string): string =>
  `${collection}/${encodeURIComponent(key)}`;

export const createInitialAppStateState = (): AppStateAccountState => ({
  bootstrapCursor: null,
  localRevision: 0,
  pendingMutations: [],
  shadow: {},
  stagingBootstrap: null,
  syncToken: null,
});

const assertSynchronousResult = (value: unknown): void => {
  if (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  ) {
    throw new TypeError("App State store reducers must be synchronous.");
  }
};

export const createAppStateMemoryStore = (
  initialStates: Readonly<Record<string, AppStateAccountState>> = {},
): AppStateStore => {
  const accounts = new Map<string, AppStateAccountState>(
    Object.entries(initialStates).map(([accountId, state]) => [
      accountId,
      deepFreeze(cloneJson(state)) as AppStateAccountState,
    ]),
  );
  const transactions = new Map<string, Promise<void>>();

  return {
    transaction: <T>(
      accountId: string,
      reducer: AppStateStoreReducer<T>,
    ): Promise<T> => {
      if (!accountId) {
        return Promise.reject(
          new TypeError("App State transactions require an account ID."),
        );
      }

      const previous = transactions.get(accountId) ?? Promise.resolve();
      const operation = previous.then(() => {
        const current = accounts.get(accountId) ?? createInitialAppStateState();
        const draft = cloneJson(current);
        const result = reducer(draft);
        assertSynchronousResult(result);
        deepFreeze(draft);
        accounts.set(accountId, draft);
        return result;
      });
      transactions.set(
        accountId,
        operation.then(
          () => undefined,
          () => undefined,
        ),
      );
      return operation;
    },
  };
};

const applyChange = (
  documents: Record<string, AppStateStoredDocument>,
  change: AppStateChange,
): void => {
  const id = appStateDocumentId(change.collection, change.key);
  const current = documents[id];
  if (current && change.version < current.version) {
    return;
  }
  if (current && change.version === current.version) {
    if (stableJson(current) !== stableJson(change)) {
      throw new AppStateProtocolError("same_version_conflict");
    }
    return;
  }
  documents[id] = cloneJson(change);
};

export const applyAppStateChangePage = (
  state: AppStateAccountState,
  changes: readonly AppStateChange[],
  nextSyncToken: string,
  target: "shadow" | "stagingBootstrap" = "shadow",
): void => {
  const current =
    target === "shadow" ? state.shadow : (state.stagingBootstrap ?? {});
  const replacement = cloneJson(current);
  for (const change of changes) {
    applyChange(replacement, change);
  }

  if (target === "shadow") {
    state.shadow = replacement;
  } else {
    state.stagingBootstrap = replacement;
  }
  state.syncToken = nextSyncToken;
};

export const applyAppStateBootstrapPage = (
  state: AppStateAccountState,
  items: readonly AppStateStoredDocument[],
  nextCursor: string | null,
): void => {
  const replacement = cloneJson(state.stagingBootstrap ?? {});
  for (const item of items) {
    applyChange(replacement, item);
  }
  state.stagingBootstrap = replacement;
  state.bootstrapCursor = nextCursor;
};

export const promoteAppStateBootstrap = (state: AppStateAccountState): void => {
  state.shadow = cloneJson(state.stagingBootstrap ?? {});
  state.stagingBootstrap = null;
  state.bootstrapCursor = null;
};

const currentPrecondition = (
  state: AppStateAccountState,
  collection: string,
  key: string,
): Pick<AppStatePendingMutation, "ifMatch" | "ifNoneMatch"> => {
  const current = state.shadow[appStateDocumentId(collection, key)];
  return current?.operation === "upsert"
    ? { ifMatch: current.etag }
    : { ifNoneMatch: "*" };
};

export const queueAppStatePut = (
  state: AppStateAccountState,
  collection: string,
  key: string,
  body: AppStatePutBody,
  idempotencyKey: string,
): number => {
  const localRevision = state.localRevision + 1;
  const mutation: AppStatePendingPut = {
    ...currentPrecondition(state, collection, key),
    body: cloneJson(body),
    collection,
    idempotencyKey,
    key,
    localRevision,
    method: "PUT",
  };
  deepFreeze(mutation);
  state.pendingMutations = [...state.pendingMutations, mutation];
  state.localRevision = localRevision;
  return localRevision;
};

export const queueAppStateDelete = (
  state: AppStateAccountState,
  collection: string,
  key: string,
  idempotencyKey: string,
): number => {
  const localRevision = state.localRevision + 1;
  const mutation: AppStatePendingMutation = {
    ...currentPrecondition(state, collection, key),
    collection,
    idempotencyKey,
    key,
    localRevision,
    method: "DELETE",
  };
  deepFreeze(mutation);
  state.pendingMutations = [...state.pendingMutations, mutation];
  state.localRevision = localRevision;
  return localRevision;
};

const visibleFromShadow = (
  shadow: Readonly<Record<string, AppStateStoredDocument>>,
): Record<string, AppStateVisibleDocument> => {
  const visible: Record<string, AppStateVisibleDocument> = {};
  for (const [id, document] of Object.entries(shadow)) {
    if (document.operation === "delete") {
      continue;
    }
    visible[id] = {
      collection: document.collection,
      etag: document.etag,
      key: document.key,
      pending: false,
      schemaVersion: document.schemaVersion,
      updatedAt: document.updatedAt,
      value: cloneJson(document.value),
      version: document.version,
    };
  }
  return visible;
};

export const deriveAppStateStateView = (
  state: AppStateAccountState,
): AppStateStateView => {
  const snapshot = cloneJson(state);
  const visible = visibleFromShadow(snapshot.shadow);
  for (const mutation of snapshot.pendingMutations) {
    const id = appStateDocumentId(mutation.collection, mutation.key);
    if (mutation.method === "DELETE") {
      delete visible[id];
      continue;
    }
    const current = visible[id];
    visible[id] = {
      collection: mutation.collection,
      etag: current?.etag ?? null,
      key: mutation.key,
      pending: true,
      schemaVersion: mutation.body.schemaVersion,
      updatedAt: current?.updatedAt ?? null,
      value: cloneJson(mutation.body.value),
      version: current?.version ?? null,
    };
  }
  return deepFreeze({ ...snapshot, visible }) as AppStateStateView;
};

export const snapshotAppStateMutations = (
  state: AppStateAccountState,
): readonly AppStatePendingMutation[] =>
  deepFreeze(cloneJson(state.pendingMutations));

export const removeAppStateMutation = (
  state: AppStateAccountState,
  localRevision: number,
): void => {
  state.pendingMutations = state.pendingMutations.filter(
    (mutation) => mutation.localRevision !== localRevision,
  );
};

export const replaceAppStateMutation = (
  state: AppStateAccountState,
  mutation: AppStatePendingMutation,
): void => {
  state.pendingMutations = state.pendingMutations.map((pending) =>
    pending.localRevision === mutation.localRevision
      ? (deepFreeze(cloneJson(mutation)) as AppStatePendingMutation)
      : pending,
  );
};
