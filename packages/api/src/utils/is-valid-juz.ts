import type { JuzNumber } from "../types";

/**
 * Validates juz number
 * @param juz juz number
 * @example
 * isValidJuz('1') // true
 * isValidJuz('30') // true
 * isValidJuz('0') // false
 * isValidJuz('-1') // false
 * isValidJuz('200') // false
 */
export const isValidJuz = (juz: string | number): juz is JuzNumber => {
  const parsedJuz = typeof juz === "number" ? juz : Number(juz);
  if (!parsedJuz || parsedJuz <= 0 || parsedJuz > 30) return false;
  return true;
};
