import type { RubNumber } from "../types";

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
  const parsedRub = typeof rub === "number" ? rub : Number(rub);
  return Number.isInteger(parsedRub) && parsedRub >= 1 && parsedRub <= 240;
};
