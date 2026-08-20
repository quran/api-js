import type { ApiParams } from "../BaseApiParams";
import type { TranslatedName } from "./TranslatedName";

export interface RecitationResource {
  id?: number;
  reciterName?: string;
  style?: string;
  translatedName?: TranslatedName;
}

export interface RecitationInfoResource {
  id?: number;
  info?: string;
}

export interface TranslationResource {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName?: TranslatedName;
}

export interface TranslationInfoResource {
  id?: number;
  info?: string;
}

export interface TafsirResource {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName?: TranslatedName;
}

export interface TafsirInfoResource {
  id?: number;
  info?: string;
}

export interface RecitationStylesResource {
  mujawwad: string;
  murattal: string;
  muallim: string;
}

export interface LanguageResource {
  id?: number;
  name?: string;
  nativeName?: string;
  isoCode?: string;
  direction?: string;
  translatedNames?: TranslatedName[];
}

export interface ChapterInfoResource {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName?: TranslatedName;
}

export interface VerseMediaResource {
  id?: number;
  name?: string;
  authorName?: string;
  languageName?: string;
}

export interface ChapterReciterResource {
  id: number;
  name: string;
  arabicName?: string;
  relativePath?: string;
  format?: string;
  filesSize?: number; // in kb
}

export type ContentSyncResourceGroup =
  | "articles"
  | "recitations"
  | "tafsirs"
  | "translations"
  | "word_by_word_translations";

export interface WordByWordTranslationSnapshotRecord
  extends Record<string, unknown> {
  id: number;
  resourceContentId: number;
  resourceId: number;
  wordId: number;
  languageId: number;
  languageName: string | null;
  text: string | null;
  priority: number | null;
  updatedAt: string;
}

export type ContentSyncMutationType =
  | "RESOURCE_CREATE"
  | "RESOURCE_UPDATE"
  | "RESOURCE_DELETE"
  | "ROW_CREATE"
  | "ROW_UPDATE"
  | "ROW_DELETE"
  | "RESOURCE_INVALIDATE";

export interface ContentSyncOptions extends ApiParams {
  /** Resource filter, e.g. `articles:*;translations:1,6;word_by_word_translations:85`. */
  resources?: string;
  /** Set to true for the initial sync. */
  bootstrap?: boolean;
  /** Token returned by the final bootstrap or incremental page. */
  syncToken?: string;
  /** Pagination cursor from `nextPageUrl`. */
  cursor?: string;
  /** Page size, up to the API maximum. */
  perPage?: number;
}

export type ContentResourceSnapshotOptions = ApiParams;

export interface ContentSyncMutation<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  sequence: number;
  type: ContentSyncMutationType;
  resourceGroup: ContentSyncResourceGroup;
  resourceId: number;
  resourceContentId: number | null;
  recordType: string | null;
  recordKey: string | null;
  sourceRecordId: number | null;
  changedAt: string;
  data: TData | null;
  snapshotUrl: string | null;
  unavailableReason: string | null;
}

export interface ContentSyncResponse<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  sync: {
    syncUntilSequence: number;
    hasMore: boolean;
    nextPageUrl: string | null;
    nextSyncToken: string | null;
    mutations: ContentSyncMutation<TData>[];
  };
}

export interface ContentResourceSnapshot<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> {
  resourceGroup: ContentSyncResourceGroup;
  resourceId: number;
  resourceContentId: number | null;
  schemaVersion: number;
  syncSequence: number;
  records: TRecord[];
}
