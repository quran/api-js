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
  | "chapter_recitations"
  | "mushafs"
  | "recitations"
  | "tafsirs"
  | "translations"
  | "word_by_word_transliterations"
  | "word_by_word_translations";

export interface MushafMetadataSnapshotRecord extends Record<string, unknown> {
  recordType: "mushaf";
  id: number;
  resourceContentId: number;
  name: string;
  description: string | null;
  pagesCount: number;
  linesPerPage: number;
  defaultFontName: string;
  mappingMode: string;
  qirat: { id: number; name: string } | null;
}

export interface MushafPageSnapshotRecord extends Record<string, unknown> {
  recordType: "mushaf_page";
  id: number;
  mushafId: number;
  pageNumber: number;
  firstVerseId: number | null;
  lastVerseId: number | null;
  firstWordId: number | null;
  lastWordId: number | null;
  versesCount: number | null;
  verseMapping: Record<string, unknown> | null;
  updatedAt: string;
}

export interface MushafFontAssetSnapshotRecord extends Record<string, unknown> {
  recordType: "font_asset";
  id: number;
  assetKey: string;
  mushafId: number;
  pageNumber: number | null;
  fontFamily: string;
  format: string;
  mimeType: string;
  url: string;
  sha256: string;
  byteSize: number;
  version: string;
  provider: string;
  licenseName: string;
  licenseUrl: string | null;
  attribution: string | null;
  updatedAt: string;
}

export interface MushafWordSnapshotRecord extends Record<string, unknown> {
  recordType: "mushaf_word";
  id: number;
  mushafId: number;
  wordId: number;
  verseId: number;
  sourceVerseId: number | null;
  text: string | null;
  charTypeId: number | null;
  charTypeName: string | null;
  pageNumber: number | null;
  lineNumber: number | null;
  positionInVerse: number | null;
  positionInLine: number | null;
  positionInPage: number | null;
  cssClass: string | null;
  cssStyle: string | null;
}

export type MushafSnapshotRecord =
  | MushafMetadataSnapshotRecord
  | MushafPageSnapshotRecord
  | MushafFontAssetSnapshotRecord
  | MushafWordSnapshotRecord;

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

export interface WordByWordTransliterationSnapshotRecord
  extends Record<string, unknown> {
  id: number;
  resourceContentId: number;
  resourceId: number;
  wordId: number;
  languageId: number;
  languageName: string | null;
  text: string | null;
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
  /** Resource filter, e.g. `articles:*;mushafs:1;translations:1,6;word_by_word_transliterations:60`. */
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
