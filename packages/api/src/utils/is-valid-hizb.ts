import type { HizbNumber } from "../types";
import { parseReferenceNumber } from "./parse-reference-number";

/**
 * Validates hizb number
 * @param hizb hizb number
 * @example
 * isValidHizb('1') // true
 * isValidHizb('60') // true
 * isValidHizb('0') // false
 * isValidHizb('-1') // false
 * isValidHizb('200') // false
 */
export const isValidHizb = (hizb: string | number): hizb is HizbNumber => {
  const parsedHizb = parseReferenceNumber(hizb);
  return parsedHizb !== null && parsedHizb <= 60;
};
