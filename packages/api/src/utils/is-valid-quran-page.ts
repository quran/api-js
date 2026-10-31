import type { PageNumber } from "../types";
import { parseReferenceNumber } from "./parse-reference-number";

/**
 * Validates mushaf page number
 * @param page mushaf page number
 * @example
 * isValidQuranPage('1') // true
 * isValidQuranPage('604') // true
 * isValidQuranPage('0') // false
 * isValidQuranPage('-1') // false
 * isValidQuranPage('1000') // false
 */
export const isValidQuranPage = (page: string | number): page is PageNumber => {
  const parsedPage = parseReferenceNumber(page);
  return parsedPage !== null && parsedPage <= 604;
};
