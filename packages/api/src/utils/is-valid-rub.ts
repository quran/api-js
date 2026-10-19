import type { RubNumber } from "../types";
import { parseReferenceNumber } from "./parse-reference-number";

/**
 * Validates rub number
 * @param rub rub number
 * @example
 * isValidRub('1') // true
 * isValidRub('240') // true
 * isValidRub('0') // false
 * isValidRub('-1') // false
 * isValidRub('300') // false
 */
export const isValidRub = (rub: string | number): rub is RubNumber => {
  const parsedRub = parseReferenceNumber(rub);
  return parsedRub !== null && parsedRub <= 240;
};
