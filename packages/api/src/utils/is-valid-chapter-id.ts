import type { ChapterId } from "../types";

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
  const parsedId = typeof id === "number" ? id : Number(id);
  if (!parsedId || parsedId <= 0 || parsedId > 114) return false;
  return true;
};
