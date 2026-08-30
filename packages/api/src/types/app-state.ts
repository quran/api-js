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

export type AppStateMutationOptions = { idempotencyKey: string } &
  AppStatePrecondition;
