import type { ApiParams } from "./BaseApiParams";

export type AppStateJsonValue =
  | boolean
  | number
  | string
  | null
  | AppStateJsonValue[]
  | { [key: string]: AppStateJsonValue };

export interface AppStateSuccess<T> {
  data: T;
  success: true;
}

export type AppStateResponse<T> = AppStateSuccess<T> & {
  /** Opaque quoted ETag. Store and send it unchanged. */
  etag: string | null;
  /** HTTP 200 for a read/replacement or 201 for a newly created document. */
  status: number;
};

export interface AppStateCollection {
  maxDocumentsPerUser: number;
  name: string;
  requiresPrecondition: boolean;
}

export interface AppStateLimits {
  changeRetentionDays: number;
  maxDocumentBytes: number;
  maxDocumentsPerUser: number;
  quotaBytesPerUser: number;
}

export interface AppStateConfiguration {
  collections: AppStateCollection[];
  configVersion: number;
  limits: AppStateLimits;
}

export interface AppStateDocument {
  collection: string;
  key: string;
  schemaVersion: number;
  updatedAt: string;
  value: AppStateJsonValue;
  version: number;
}

export interface AppStateDocumentWithEtag extends AppStateDocument {
  etag: string;
}

export interface AppStateMutationResult {
  collection: string;
  key: string;
  schemaVersion: number;
  updatedAt: string;
  version: number;
}

export interface AppStatePage {
  hasMore: boolean;
  items: AppStateDocumentWithEtag[];
  nextCursor: string | null;
}

export interface AppStateBootstrapPage extends AppStatePage {
  nextSyncToken: string | null;
}

export interface AppStateChange extends AppStateDocumentWithEtag {
  operation: "delete" | "upsert";
}

export interface AppStateChangesPage {
  changes: AppStateChange[];
  hasMore: boolean;
  nextSyncToken: string;
}

export interface AppStatePageOptions extends ApiParams {
  cursor?: string;
  limit?: number;
}

export interface AppStateChangesOptions extends ApiParams {
  limit?: number;
}

export interface AppStatePutBody {
  schemaVersion: number;
  value: AppStateJsonValue;
}

type AppStatePrecondition =
  | { ifMatch: string; ifNoneMatch?: never }
  | { ifMatch?: never; ifNoneMatch: string }
  | { ifMatch?: never; ifNoneMatch?: never };

export type AppStateMutationOptions = {
  idempotencyKey: string;
} & AppStatePrecondition;

/** Structural low-level transport used by App State reconciliation clients. */
export interface AppStateTransport {
  bootstrap(
    options?: AppStatePageOptions,
  ): Promise<AppStateSuccess<AppStateBootstrapPage>>;
  deleteDocument(
    collection: string,
    key: string,
    options: AppStateMutationOptions,
  ): Promise<void>;
  getChanges(
    since: string,
    options?: AppStateChangesOptions,
  ): Promise<AppStateSuccess<AppStateChangesPage>>;
  getConfiguration(): Promise<AppStateSuccess<AppStateConfiguration>>;
  getDocument(
    collection: string,
    key: string,
  ): Promise<AppStateResponse<AppStateDocument>>;
  listDocuments(
    collection: string,
    options?: AppStatePageOptions,
  ): Promise<AppStateSuccess<AppStatePage>>;
  putDocument(
    collection: string,
    key: string,
    body: AppStatePutBody,
    options: AppStateMutationOptions,
  ): Promise<AppStateResponse<AppStateMutationResult>>;
}

export type AppStateStoredDocument = AppStateChange;

export interface AppStatePendingMutationBase {
  collection: string;
  idempotencyKey: string;
  ifMatch?: string;
  ifNoneMatch?: string;
  key: string;
  localRevision: number;
}

export interface AppStatePendingPut extends AppStatePendingMutationBase {
  body: AppStatePutBody;
  method: "PUT";
}

export interface AppStatePendingDelete extends AppStatePendingMutationBase {
  method: "DELETE";
}

export type AppStatePendingMutation =
  | AppStatePendingDelete
  | AppStatePendingPut;

export interface AppStateAccountState {
  bootstrapCursor: string | null;
  localRevision: number;
  pendingMutations: AppStatePendingMutation[];
  shadow: Record<string, AppStateStoredDocument>;
  stagingBootstrap: Record<string, AppStateStoredDocument> | null;
  syncToken: string | null;
}

export interface AppStateVisibleDocument {
  collection: string;
  etag: string | null;
  key: string;
  pending: boolean;
  schemaVersion: number;
  updatedAt: string | null;
  value: AppStateJsonValue;
  version: number | null;
}

export interface AppStateStateView extends AppStateAccountState {
  visible: Record<string, AppStateVisibleDocument>;
}

export type AppStateStoreReducer<T> = (state: AppStateAccountState) => T;

/**
 * Account-scoped durable storage for the reconciliation engine. Implementations
 * must initialize missing accounts and commit a reducer's complete synchronous
 * state transition atomically. If the reducer throws, no state may be changed.
 */
export interface AppStateStore {
  transaction<T>(
    accountId: string,
    reducer: AppStateStoreReducer<T>,
  ): Promise<T>;
}

export interface AppStateReconcilerOptions {
  accountId: string;
  createIdempotencyKey?: () => string;
  maxRebaseAttempts?: number;
  pageSize?: number;
  store: AppStateStore;
  transport: AppStateTransport;
}

export interface AppStateReconciler {
  deleteDocument(collection: string, key: string): Promise<AppStateStateView>;
  getState(): Promise<AppStateStateView>;
  putDocument(
    collection: string,
    key: string,
    body: AppStatePutBody,
  ): Promise<AppStateStateView>;
  reconcile(): Promise<AppStateStateView>;
  switchAccount(accountId: string): Promise<AppStateStateView>;
}
