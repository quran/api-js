import type { HizbNumber } from "../types";

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
  const parsedHizb = typeof hizb === "number" ? hizb : Number(hizb);
  if (!parsedHizb || parsedHizb <= 0 || parsedHizb > 60) return false;
  return true;
};
