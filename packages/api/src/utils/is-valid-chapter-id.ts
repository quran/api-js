import type { ChapterId } from "../types";
import { parseReferenceNumber } from "./parse-reference-number";

/**
 * Validates chapter id
 * @param id chapter id
 * @example
 * isValidChapterId('1') // true
 * isValidChapterId('114') // true
 * isValidChapterId('0') // false
 * isValidChapterId('-1') // false
 * isValidChapterId('200') // false
 */
export const isValidChapterId = (id: string | number): id is ChapterId => {
  const parsedId = parseReferenceNumber(id);
  return parsedId !== null && parsedId <= 114;
};
