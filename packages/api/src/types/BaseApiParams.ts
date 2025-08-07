import type { Language } from ".";

export type ApiParams = Record<
  string,
  string | number | boolean | unknown[] | undefined
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

/**
 * Search parameters
 */
export interface SearchParams extends BaseApiParams {
  /** Number of results to return */
  size?: number;
  /** Page number for pagination */
  page?: number;
}
