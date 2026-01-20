import type {
  Language,
  TranslationField,
  VerseField,
  WordField,
} from ".";

export type ApiParams = Record<
  string,
  string | number | boolean | unknown[] | undefined | Record<string, boolean>
>;

/**
 * Base parameters that are common across most API endpoints
 */
export interface BaseApiParams extends ApiParams {
  /** Language for the response */
  language?: Language;
}

/**
 * Pagination parameters
 */
export interface PaginationParams extends ApiParams {
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  perPage?: number;
}

export type BinaryString = "0" | "1";

export enum SearchMode {
  Advanced = "advanced",
  Quick = "quick",
}

/**
 * Search parameters
 */
export interface SearchParams extends BaseApiParams {
  /** Search mode */
  mode: SearchMode;
  /** Search query */
  query: string;
  /** Filter translations */
  filterTranslations?: string | string[];
  /** For advanced search, limit to exact matches */
  exactMatchesOnly?: BinaryString;
  /** Include text in the response */
  getText?: BinaryString;
  /** Include highlighted text */
  highlight?: BinaryString;
  /** Quick search navigational results count */
  navigationalResultsNumber?: number;
  /** Quick search verse results count */
  versesResultsNumber?: number;
  /** Comma-separated list of indexes */
  indexes?: string | string[];
  /** Page number for pagination */
  page?: number;
  /** Number of results to return */
  size?: number;
  /** Translation IDs to use for language detection */
  translationIds?: string | number | Array<string | number>;
  /** Quran fields to include in verse filters */
  fields?: Partial<Record<VerseField, boolean>>;
  /** Translation fields to include in verse filters */
  translationFields?: Partial<Record<TranslationField, boolean>>;
  /** Word fields to include in verse filters */
  wordFields?: Partial<Record<WordField, boolean>>;
  /** Include word data in verse filters */
  words?: boolean;
}
