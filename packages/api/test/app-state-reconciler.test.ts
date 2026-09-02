import { describe, expect, it } from "vitest";

import type {
  AppStateChange,
  AppStateStore,
  AppStateTransport,
} from "../src/types/app-state";
import { createAppStateReconciler } from "../src/runtime/app-state-reconciler";
import {
  applyAppStateChangePage,
  createAppStateMemoryStore,
  deriveAppStateStateView,
} from "../src/runtime/app-state-state";
import { QuranHttpError } from "../src/sdk/http-error";

const THEME_V1: AppStateChange = {
  collection: "settings",
  etag: '"etag-v1"',
  key: "theme",
  operation: "upsert",
  schemaVersion: 1,
  updatedAt: "2026-08-27T00:00:00.000Z",
  value: { mode: "dark" },
  version: 1,
};
const THEME_V2: AppStateChange = {
  ...THEME_V1,
  etag: '"etag-v2"',
  updatedAt: "2026-08-27T00:05:00.000Z",
  value: { mode: "light" },
  version: 2,
};
const THEME_V3: AppStateChange = {
  ...THEME_V2,
  etag: '"etag-v3"',
  updatedAt: "2026-08-27T00:10:00.000Z",
  value: { mode: "sepia" },
  version: 3,
};

const GATEWAY_SYNC_TOKEN_EXPIRED_ENVELOPE =
  '{"message":"The sync token has expired.","type":"gone","success":false,"details":{"success":false,"error":{"code":"sync_token_expired","message":"The sync token has expired."}}}';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
};

const waitFor = async (predicate: () => boolean): Promise<void> => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("Condition was not reached.");
};

const errorResponse = async (
  status: number,
  code:
    | "bootstrap_required"
    | "document_not_found"
    | "precondition_failed"
    | "sync_token_expired",
  currentETag?: string,
): Promise<QuranHttpError> =>
  QuranHttpError.fromResponse(
    new Response(
      code === "sync_token_expired" && currentETag === undefined
        ? GATEWAY_SYNC_TOKEN_EXPIRED_ENVELOPE
        : JSON.stringify({
            details: {
              success: false,
              error: {
                code,
                message: "request failed",
                ...(currentETag === undefined
                  ? {}
                  : { details: { currentETag } }),
              },
            },
            message: "request failed",
            success: false,
            type: "app_state_error",
          }),
      {
        headers: { "content-type": "application/json" },
        status,
        statusText: "Request failed",
      },
    ),
  );

const createTransport = (
  overrides: Partial<AppStateTransport>,
): AppStateTransport => ({
  bootstrap: () =>
    Promise.resolve({
      data: {
        hasMore: false,
        items: [],
        nextCursor: null,
        nextSyncToken: "bootstrap-token",
      },
      success: true,
    }),
  deleteDocument: () => Promise.resolve(),
  getChanges: (since) =>
    Promise.resolve({
      data: { changes: [], hasMore: false, nextSyncToken: since },
      success: true,
    }),
  getConfiguration: () =>
    Promise.reject(new Error("Unexpected getConfiguration call.")),
  getDocument: () => Promise.reject(new Error("Unexpected getDocument call.")),
  listDocuments: () =>
    Promise.reject(new Error("Unexpected listDocuments call.")),
  putDocument: () => Promise.reject(new Error("Unexpected putDocument call.")),
  ...overrides,
});

describe("App State reconciler", () => {
  it("keeps bootstrap pages in staging, drains changes, and promotes only when complete", async () => {
    const store = createAppStateMemoryStore();
    const finalBootstrapPage =
      deferred<Awaited<ReturnType<AppStateTransport["bootstrap"]>>>();
    const bootstrapCursors: Array<string | undefined> = [];
    const changeTokens: string[] = [];
    const transport = createTransport({
      bootstrap: async (options = {}) => {
        bootstrapCursors.push(options.cursor);
        if (bootstrapCursors.length === 1) {
          return {
            data: {
              hasMore: true,
              items: [THEME_V1],
              nextCursor: "bootstrap-cursor-2",
              nextSyncToken: null,
            },
            success: true,
          };
        }
        return finalBootstrapPage.promise;
      },
      getChanges: (since) => {
        changeTokens.push(since);
        return Promise.resolve(
          changeTokens.length === 1
            ? {
                data: {
                  changes: [THEME_V3],
                  hasMore: false,
                  nextSyncToken: "sync-3",
                },
                success: true,
              }
            : {
                data: {
                  changes: [],
                  hasMore: false,
                  nextSyncToken: "sync-4",
                },
                success: true,
              },
        );
      },
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store,
      transport,
    });

    const reconciliation = reconciler.reconcile();
    await waitFor(() => bootstrapCursors.length === 2);
    const staged = await reconciler.getState();
    expect(staged.shadow).toEqual({});
    expect(staged.stagingBootstrap).toHaveProperty("settings/theme");
    expect(staged.bootstrapCursor).toBe("bootstrap-cursor-2");

    finalBootstrapPage.resolve({
      data: {
        hasMore: false,
        items: [THEME_V2],
        nextCursor: null,
        nextSyncToken: "bootstrap-sync-2",
      },
      success: true,
    });
    const view = await reconciliation;

    expect(bootstrapCursors).toEqual([undefined, "bootstrap-cursor-2"]);
    expect(changeTokens).toEqual(["bootstrap-sync-2", "sync-3"]);
    expect(view.stagingBootstrap).toBeNull();
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "sepia" });
    expect(view.syncToken).toBe("sync-4");
  });

  it("rejects a final bootstrap page without a sync token before committing it", async () => {
    const store = createAppStateMemoryStore();
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store,
      transport: createTransport({
        bootstrap: () =>
          Promise.resolve({
            data: {
              hasMore: false,
              items: [THEME_V1],
              nextCursor: null,
              nextSyncToken: null,
            },
            success: true,
          }),
      }),
    });

    await expect(reconciler.reconcile()).rejects.toMatchObject({
      code: "bootstrap_sync_token_missing",
    });
    const view = await reconciler.getState();
    expect(view.shadow).toEqual({});
    expect(view.stagingBootstrap).toBeNull();
    expect(view.syncToken).toBeNull();
  });

  it("drains every normal change page and atomically advances each token", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    const tokens: string[] = [];
    const transport = createTransport({
      getChanges: (since) => {
        tokens.push(since);
        if (since === "sync-1") {
          return Promise.resolve({
            data: {
              changes: [THEME_V2],
              hasMore: true,
              nextSyncToken: "sync-2",
            },
            success: true,
          });
        }
        if (since === "sync-2") {
          return Promise.resolve({
            data: {
              changes: [THEME_V3],
              hasMore: false,
              nextSyncToken: "sync-3",
            },
            success: true,
          });
        }
        return Promise.resolve({
          data: { changes: [], hasMore: false, nextSyncToken: "sync-4" },
          success: true,
        });
      },
    });

    const view = await createAppStateReconciler({
      accountId: "account-a",
      store,
      transport,
    }).reconcile();

    expect(tokens).toEqual(["sync-1", "sync-2", "sync-3"]);
    expect(view.visible["settings/theme"]?.version).toBe(3);
    expect(view.syncToken).toBe("sync-4");
  });

  it("captures replay work before awaiting and removes only the completed revision", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    const firstPut =
      deferred<Awaited<ReturnType<AppStateTransport["putDocument"]>>>();
    const sentValues: unknown[] = [];
    const transport = createTransport({
      putDocument: async (_collection, _key, body) => {
        sentValues.push(body.value);
        return firstPut.promise;
      },
    });
    let keyNumber = 0;
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => `mutation-key-${++keyNumber}`,
      store,
      transport,
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "sepia" },
    });

    const reconciliation = reconciler.reconcile();
    await waitFor(() => sentValues.length === 1);
    await reconciler.putDocument("settings", "font", {
      schemaVersion: 1,
      value: { size: 18 },
    });
    firstPut.resolve({
      data: {
        collection: "settings",
        key: "theme",
        schemaVersion: 1,
        updatedAt: "2026-08-27T00:15:00.000Z",
        version: 2,
      },
      etag: '"etag-v2"',
      status: 200,
      success: true,
    });

    const view = await reconciliation;
    expect(sentValues).toEqual([{ mode: "sepia" }]);
    expect(view.pendingMutations).toHaveLength(1);
    expect(view.pendingMutations[0]).toMatchObject({
      key: "font",
      localRevision: 2,
    });
  });

  it("queues a visible delete and replays it with the captured strict precondition", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    const deleteOptions: unknown[] = [];
    let pulls = 0;
    const transport = createTransport({
      deleteDocument: (_collection, _key, options) => {
        deleteOptions.push(options);
        return Promise.resolve();
      },
      getChanges: (since) => {
        pulls += 1;
        return Promise.resolve({
          data: {
            changes:
              pulls === 2
                ? [{ ...THEME_V2, operation: "delete" as const, value: null }]
                : [],
            hasMore: false,
            nextSyncToken: pulls === 2 ? "sync-2" : since,
          },
          success: true,
        });
      },
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "delete-key-0001",
      store,
      transport,
    });

    const queued = await reconciler.deleteDocument("settings", "theme");
    expect(queued.visible).not.toHaveProperty("settings/theme");
    const reconciled = await reconciler.reconcile();

    expect(deleteOptions).toEqual([
      { idempotencyKey: "delete-key-0001", ifMatch: THEME_V1.etag },
    ]);
    expect(reconciled.pendingMutations).toEqual([]);
    expect(reconciled.shadow["settings/theme"]).toMatchObject({
      operation: "delete",
      version: 2,
    });
    expect(reconciled.visible).not.toHaveProperty("settings/theme");
  });

  it("treats deleting an already absent document as reconciled", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      state.syncToken = "sync-1";
    });
    const transport = createTransport({
      deleteDocument: () =>
        errorResponse(404, "document_not_found").then((error) =>
          Promise.reject(error),
        ),
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "delete-key-0001",
      store,
      transport,
    });
    await reconciler.deleteDocument("settings", "missing");

    const view = await reconciler.reconcile();

    expect(view.pendingMutations).toEqual([]);
    expect(view.visible).not.toHaveProperty("settings/missing");
  });

  it("keeps a conflicted delete hidden when refresh finds it absent and the final pull fails", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    let changeReads = 0;
    const transport = createTransport({
      deleteDocument: () =>
        errorResponse(412, "precondition_failed").then((error) =>
          Promise.reject(error),
        ),
      getChanges: (since) => {
        changeReads += 1;
        if (changeReads === 2) {
          return Promise.reject(new Error("final pull failed"));
        }
        return Promise.resolve({
          data: { changes: [], hasMore: false, nextSyncToken: since },
          success: true,
        });
      },
      getDocument: () =>
        errorResponse(404, "document_not_found").then((error) =>
          Promise.reject(error),
        ),
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "delete-key-0001",
      store,
      transport,
    });
    await reconciler.deleteDocument("settings", "theme");

    await expect(reconciler.reconcile()).rejects.toThrow("final pull failed");

    const state = await reconciler.getState();
    expect(state.pendingMutations).toEqual([]);
    expect(state.shadow["settings/theme"]?.operation).toBe("delete");
    expect(state.visible).not.toHaveProperty("settings/theme");
  });

  it("retains an optimistic PUT when a successful response omits its ETag", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "put-key-0001",
      store,
      transport: createTransport({
        putDocument: () =>
          Promise.resolve({
            data: {
              collection: "settings",
              key: "theme",
              schemaVersion: 1,
              updatedAt: "2026-08-27T00:15:00.000Z",
              version: 2,
            },
            etag: null,
            status: 200,
            success: true,
          }),
      }),
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "night" },
    });

    await expect(reconciler.reconcile()).rejects.toMatchObject({
      code: "put_response_etag_missing",
    });

    const state = await reconciler.getState();
    expect(state.pendingMutations).toHaveLength(1);
    expect(state.visible["settings/theme"]?.value).toEqual({ mode: "night" });
  });

  it("rebases complete PUT replacement intent with a new precondition and idempotency key", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V2], "sync-2");
    });
    const requests: Array<{
      body: unknown;
      idempotencyKey: string;
      ifMatch?: string;
    }> = [];
    const transport = createTransport({
      getDocument: () =>
        Promise.resolve({
          data: THEME_V3,
          etag: THEME_V3.etag,
          status: 200,
          success: true,
        }),
      putDocument: async (_collection, _key, body, options) => {
        requests.push({
          body,
          idempotencyKey: options.idempotencyKey,
          ifMatch: options.ifMatch,
        });
        if (requests.length === 1) {
          throw await errorResponse(412, "precondition_failed", THEME_V3.etag);
        }
        return {
          data: {
            collection: "settings",
            key: "theme",
            schemaVersion: 1,
            updatedAt: "2026-08-27T00:15:00.000Z",
            version: 4,
          },
          etag: '"etag-v4"',
          status: 200,
          success: true,
        };
      },
    });
    const keys = ["strict-conflict-key-0001", "strict-conflict-key-0002"];
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => keys.shift()!,
      store,
      transport,
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "night" },
    });

    const view = await reconciler.reconcile();

    expect(requests).toEqual([
      {
        body: { schemaVersion: 1, value: { mode: "night" } },
        idempotencyKey: "strict-conflict-key-0001",
        ifMatch: THEME_V2.etag,
      },
      {
        body: { schemaVersion: 1, value: { mode: "night" } },
        idempotencyKey: "strict-conflict-key-0002",
        ifMatch: THEME_V3.etag,
      },
    ]);
    expect(view.pendingMutations).toEqual([]);
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "night" });
    expect(view.visible["settings/theme"]?.version).toBe(4);
  });

  it("rebases a replacement as a create when the conflicting document was deleted", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V2], "sync-2");
    });
    const requests: Array<{
      idempotencyKey: string;
      ifMatch?: string;
      ifNoneMatch?: string;
    }> = [];
    const transport = createTransport({
      getDocument: () =>
        errorResponse(404, "document_not_found").then((error) =>
          Promise.reject(error),
        ),
      putDocument: async (_collection, _key, _body, options) => {
        requests.push(options);
        if (requests.length === 1) {
          throw await errorResponse(412, "precondition_failed");
        }
        return {
          data: {
            collection: "settings",
            key: "theme",
            schemaVersion: 1,
            updatedAt: "2026-08-27T00:15:00.000Z",
            version: 4,
          },
          etag: '"etag-v4"',
          status: 201,
          success: true,
        };
      },
    });
    const keys = ["replacement-key-0001", "replacement-key-0002"];
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => keys.shift()!,
      store,
      transport,
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "night" },
    });

    const view = await reconciler.reconcile();

    expect(requests).toEqual([
      {
        idempotencyKey: "replacement-key-0001",
        ifMatch: THEME_V2.etag,
      },
      {
        idempotencyKey: "replacement-key-0002",
        ifNoneMatch: "*",
      },
    ]);
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "night" });
  });

  it("bounds repeated conflict rebases", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V2], "sync-2");
    });
    let puts = 0;
    let reads = 0;
    const transport = createTransport({
      getDocument: () => {
        reads += 1;
        return Promise.resolve({
          data: THEME_V3,
          etag: THEME_V3.etag,
          status: 200,
          success: true,
        });
      },
      putDocument: async () => {
        puts += 1;
        throw await errorResponse(412, "precondition_failed");
      },
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => `mutation-key-${puts + reads + 1}`,
      maxRebaseAttempts: 1,
      store,
      transport,
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "night" },
    });

    await expect(reconciler.reconcile()).rejects.toMatchObject({
      status: 412,
    });
    expect(puts).toBe(2);
    expect(reads).toBe(1);
    expect((await reconciler.getState()).pendingMutations).toHaveLength(1);
  });

  it("recovers an expired token through staging without dropping pending mutations", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V2], "expired-sync");
    });
    const tokens: string[] = [];
    const transport = createTransport({
      bootstrap: () =>
        Promise.resolve({
          data: {
            hasMore: false,
            items: [THEME_V3],
            nextCursor: null,
            nextSyncToken: "bootstrap-sync",
          },
          success: true,
        }),
      getChanges: async (since) => {
        tokens.push(since);
        if (since === "expired-sync") {
          throw await errorResponse(410, "sync_token_expired");
        }
        if (since === "bootstrap-sync") {
          return {
            data: {
              changes: [],
              hasMore: false,
              nextSyncToken: "recovered-sync",
            },
            success: true,
          };
        }
        return {
          data: {
            changes: [
              {
                ...THEME_V3,
                etag: '"etag-v4"',
                updatedAt: "2026-08-27T00:15:00.000Z",
                value: { mode: "night" },
                version: 4,
              },
            ],
            hasMore: false,
            nextSyncToken: "sync-4",
          },
          success: true,
        };
      },
      putDocument: () =>
        Promise.resolve({
          data: {
            collection: "settings",
            key: "theme",
            schemaVersion: 1,
            updatedAt: "2026-08-27T00:15:00.000Z",
            version: 4,
          },
          etag: '"etag-v4"',
          status: 200,
          success: true,
        }),
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "mutation-key-0001",
      store,
      transport,
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "night" },
    });

    const view = await reconciler.reconcile();

    expect(tokens).toEqual([
      "expired-sync",
      "bootstrap-sync",
      "recovered-sync",
    ]);
    expect(view.pendingMutations).toEqual([]);
    expect(view.visible["settings/theme"]?.value).toEqual({ mode: "night" });
    expect(view.syncToken).toBe("sync-4");
  });

  it("restarts bootstrap when recovery is required before the first drain page", async () => {
    const store = createAppStateMemoryStore();
    const bootstrapCursors: Array<string | undefined> = [];
    const changeTokens: string[] = [];
    const putValues: unknown[] = [];
    const transport = createTransport({
      bootstrap: (options = {}) => {
        bootstrapCursors.push(options.cursor);
        return Promise.resolve({
          data: {
            hasMore: false,
            items: bootstrapCursors.length === 1 ? [THEME_V1] : [THEME_V3],
            nextCursor: null,
            nextSyncToken:
              bootstrapCursors.length === 1
                ? "rejected-bootstrap-sync"
                : "fresh-bootstrap-sync",
          },
          success: true,
        });
      },
      getChanges: async (since) => {
        changeTokens.push(since);
        if (since === "rejected-bootstrap-sync") {
          throw await errorResponse(410, "bootstrap_required");
        }
        return {
          data: {
            changes: [],
            hasMore: false,
            nextSyncToken:
              since === "fresh-bootstrap-sync"
                ? "recovered-sync"
                : "final-sync",
          },
          success: true,
        };
      },
      putDocument: (_collection, _key, body) => {
        putValues.push(body.value);
        return Promise.resolve({
          data: {
            collection: "settings",
            key: "font",
            schemaVersion: 1,
            updatedAt: "2026-08-27T00:15:00.000Z",
            version: 1,
          },
          etag: '"font-etag-v1"',
          status: 201,
          success: true,
        });
      },
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "font-mutation-key-0001",
      store,
      transport,
    });
    await reconciler.putDocument("settings", "font", {
      schemaVersion: 1,
      value: { size: 18 },
    });

    const view = await reconciler.reconcile();

    expect(bootstrapCursors).toEqual([undefined, undefined]);
    expect(changeTokens).toEqual([
      "rejected-bootstrap-sync",
      "fresh-bootstrap-sync",
      "recovered-sync",
    ]);
    expect(putValues).toEqual([{ size: 18 }]);
    expect(view.pendingMutations).toEqual([]);
    expect(view.stagingBootstrap).toBeNull();
    expect(view.visible["settings/theme"]?.version).toBe(3);
    expect(view.visible["settings/font"]?.value).toEqual({ size: 18 });
    expect(view.syncToken).toBe("final-sync");
  });

  it("discards partial staging before restarting an expired bootstrap drain", async () => {
    const store = createAppStateMemoryStore();
    const partialOnlyChange: AppStateChange = {
      ...THEME_V2,
      etag: '"obsolete-etag-v1"',
      key: "obsolete",
      value: { enabled: true },
      version: 1,
    };
    let bootstrapCalls = 0;
    const changeTokens: string[] = [];
    const transport = createTransport({
      bootstrap: () => {
        bootstrapCalls += 1;
        return Promise.resolve({
          data: {
            hasMore: false,
            items: bootstrapCalls === 1 ? [THEME_V1] : [THEME_V3],
            nextCursor: null,
            nextSyncToken:
              bootstrapCalls === 1 ? "partial-sync-1" : "fresh-sync-1",
          },
          success: true,
        });
      },
      getChanges: async (since) => {
        changeTokens.push(since);
        if (since === "partial-sync-1") {
          return {
            data: {
              changes: [partialOnlyChange],
              hasMore: true,
              nextSyncToken: "partial-sync-2",
            },
            success: true,
          };
        }
        if (since === "partial-sync-2") {
          throw await errorResponse(410, "sync_token_expired");
        }
        return {
          data: {
            changes: [],
            hasMore: false,
            nextSyncToken:
              since === "fresh-sync-1" ? "recovered-sync" : "final-sync",
          },
          success: true,
        };
      },
      putDocument: () =>
        Promise.resolve({
          data: {
            collection: "settings",
            key: "font",
            schemaVersion: 1,
            updatedAt: "2026-08-27T00:15:00.000Z",
            version: 1,
          },
          etag: '"font-etag-v1"',
          status: 201,
          success: true,
        }),
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "font-mutation-key-0001",
      store,
      transport,
    });
    await reconciler.putDocument("settings", "font", {
      schemaVersion: 1,
      value: { size: 18 },
    });

    const view = await reconciler.reconcile();

    expect(bootstrapCalls).toBe(2);
    expect(changeTokens).toEqual([
      "partial-sync-1",
      "partial-sync-2",
      "fresh-sync-1",
      "recovered-sync",
    ]);
    expect(view.pendingMutations).toEqual([]);
    expect(view.stagingBootstrap).toBeNull();
    expect(view.shadow).not.toHaveProperty("settings/obsolete");
    expect(view.visible).not.toHaveProperty("settings/obsolete");
    expect(view.visible["settings/theme"]?.version).toBe(3);
    expect(view.visible["settings/font"]?.value).toEqual({ size: 18 });
    expect(view.syncToken).toBe("final-sync");
  });

  it("rejects a late response after switching accounts", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "a-sync-1");
    });
    const oldAccountPage =
      deferred<Awaited<ReturnType<AppStateTransport["getChanges"]>>>();
    const transport = createTransport({
      getChanges: async () => oldAccountPage.promise,
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store,
      transport,
    });

    const oldReconciliation = reconciler.reconcile();
    const accountB = await reconciler.switchAccount("account-b");
    oldAccountPage.resolve({
      data: {
        changes: [THEME_V2],
        hasMore: false,
        nextSyncToken: "a-sync-2",
      },
      success: true,
    });
    await oldReconciliation;

    const accountA = await store.transaction(
      "account-a",
      deriveAppStateStateView,
    );
    expect(accountB.visible).toEqual({});
    expect(accountA.visible["settings/theme"]?.version).toBe(1);
    expect(accountA.syncToken).toBe("a-sync-1");
    expect((await reconciler.getState()).visible).toEqual({});
  });

  it("discards a stale normal pull failure after switching accounts", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "a-sync-1");
    });
    const staleFailure =
      deferred<Awaited<ReturnType<AppStateTransport["getChanges"]>>>();
    let requestStarted = false;
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store,
      transport: createTransport({
        getChanges: () => {
          requestStarted = true;
          return staleFailure.promise;
        },
      }),
    });

    const oldReconciliation = reconciler.reconcile();
    await waitFor(() => requestStarted);
    await reconciler.switchAccount("account-b");
    staleFailure.reject(new Error("stale normal pull failed"));

    await expect(oldReconciliation).resolves.toMatchObject({ visible: {} });
  });

  it("discards a stale bootstrap request failure after switching accounts", async () => {
    const staleFailure =
      deferred<Awaited<ReturnType<AppStateTransport["bootstrap"]>>>();
    let requestStarted = false;
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store: createAppStateMemoryStore(),
      transport: createTransport({
        bootstrap: () => {
          requestStarted = true;
          return staleFailure.promise;
        },
      }),
    });

    const oldReconciliation = reconciler.reconcile();
    await waitFor(() => requestStarted);
    await reconciler.switchAccount("account-b");
    staleFailure.reject(new Error("stale bootstrap failed"));

    await expect(oldReconciliation).resolves.toMatchObject({ visible: {} });
  });

  it("discards a stale bootstrap drain failure after switching accounts", async () => {
    const staleFailure =
      deferred<Awaited<ReturnType<AppStateTransport["getChanges"]>>>();
    let drainStarted = false;
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store: createAppStateMemoryStore(),
      transport: createTransport({
        bootstrap: () =>
          Promise.resolve({
            data: {
              hasMore: false,
              items: [THEME_V1],
              nextCursor: null,
              nextSyncToken: "bootstrap-sync",
            },
            success: true,
          }),
        getChanges: () => {
          drainStarted = true;
          return staleFailure.promise;
        },
      }),
    });

    const oldReconciliation = reconciler.reconcile();
    await waitFor(() => drainStarted);
    await reconciler.switchAccount("account-b");
    staleFailure.reject(new Error("stale bootstrap drain failed"));

    await expect(oldReconciliation).resolves.toMatchObject({ visible: {} });
  });

  it("does not refresh a stale mutation conflict after switching accounts", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "a-sync-1");
    });
    const conflict = deferred<QuranHttpError>();
    let putStarted = false;
    let documentReads = 0;
    const transport = createTransport({
      getDocument: () => {
        documentReads += 1;
        return Promise.resolve({
          data: THEME_V2,
          etag: THEME_V2.etag,
          status: 200,
          success: true,
        });
      },
      putDocument: async () => {
        putStarted = true;
        throw await conflict.promise;
      },
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "stale-conflict-key-0001",
      store,
      transport,
    });
    await reconciler.putDocument("settings", "theme", {
      schemaVersion: 1,
      value: { mode: "night" },
    });

    const oldReconciliation = reconciler.reconcile();
    await waitFor(() => putStarted);
    await reconciler.switchAccount("account-b");
    conflict.resolve(await errorResponse(412, "precondition_failed"));
    await oldReconciliation;

    expect(documentReads).toBe(0);
    expect(
      (await store.transaction("account-a", deriveAppStateStateView))
        .pendingMutations,
    ).toHaveLength(1);
    expect((await reconciler.getState()).visible).toEqual({});
  });

  it("does not send changes after a delayed progress read switches accounts", async () => {
    const baseStore = createAppStateMemoryStore();
    await baseStore.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "a-sync-1");
    });
    const releaseProgress = deferred<void>();
    let accountATransactions = 0;
    let progressBlocked = false;
    const store: AppStateStore = {
      transaction: async (accountId, reducer) => {
        if (accountId === "account-a") {
          accountATransactions += 1;
          if (accountATransactions === 2) {
            progressBlocked = true;
            await releaseProgress.promise;
          }
        }
        return baseStore.transaction(accountId, reducer);
      },
    };
    let changeReads = 0;
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store,
      transport: createTransport({
        getChanges: (since) => {
          changeReads += 1;
          return Promise.resolve({
            data: { changes: [], hasMore: false, nextSyncToken: since },
            success: true,
          });
        },
      }),
    });

    const oldReconciliation = reconciler.reconcile();
    await waitFor(() => progressBlocked);
    await reconciler.switchAccount("account-b");
    releaseProgress.resolve();
    await oldReconciliation;

    expect(changeReads).toBe(0);
    expect((await reconciler.getState()).visible).toEqual({});
  });

  it("keeps an acknowledged delete hidden if the final pull fails", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    let changeReads = 0;
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      createIdempotencyKey: () => "delete-key-0001",
      store,
      transport: createTransport({
        deleteDocument: () => Promise.resolve(),
        getChanges: (since) => {
          changeReads += 1;
          if (changeReads === 2) return Promise.reject(new Error("final pull failed"));
          return Promise.resolve({
            data: { changes: [], hasMore: false, nextSyncToken: since },
            success: true,
          });
        },
      }),
    });
    await reconciler.deleteDocument("settings", "theme");

    await expect(reconciler.reconcile()).rejects.toThrow("final pull failed");

    const state = await reconciler.getState();
    expect(state.pendingMutations).toEqual([]);
    expect(state.shadow["settings/theme"]?.operation).toBe("delete");
    expect(state.visible).not.toHaveProperty("settings/theme");
  });

  it("serializes concurrent reconcile calls", async () => {
    const store = createAppStateMemoryStore();
    await store.transaction("account-a", (state) => {
      applyAppStateChangePage(state, [THEME_V1], "sync-1");
    });
    const firstRequest = deferred<void>();
    let activeRequests = 0;
    let calls = 0;
    let maxActiveRequests = 0;
    const transport = createTransport({
      getChanges: async (since) => {
        calls += 1;
        activeRequests += 1;
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
        if (calls === 1) await firstRequest.promise;
        activeRequests -= 1;
        return {
          data: { changes: [], hasMore: false, nextSyncToken: since },
          success: true,
        };
      },
    });
    const reconciler = createAppStateReconciler({
      accountId: "account-a",
      store,
      transport,
    });

    const first = reconciler.reconcile();
    const second = reconciler.reconcile();
    await waitFor(() => calls > 0);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls).toBe(1);
    firstRequest.resolve();
    await Promise.all([first, second]);
    expect(maxActiveRequests).toBe(1);
  });
});
