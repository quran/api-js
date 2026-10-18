import type { VerseKey } from "../types";
import { isValidChapterId } from "./is-valid-chapter-id";
import { versesMapping } from "./verses-mapping";

/**
 * Validates verse key
 * @param key colon separated verse key (chapter:verse)
 * @example
 * isValidVerseKey('1:1') // true
 * isValidVerseKey('30:1') // true
 * isValidVerseKey('0') // false
 * isValidVerseKey('1:-') // false
 * isValidVerseKey('1_1') // false
 * isValidVerseKey('1:8') // false (Al-Fatihah has 7 verses)
 * isValidVerseKey('1:1:1') // false
 */
export const isValidVerseKey = (key: string): key is VerseKey => {
  const parts = key.trim().split(":");
  if (parts.length !== 2) return false;

  const [chapterId, verseId] = parts;
  if (!chapterId || !verseId || !isValidChapterId(chapterId)) return false;

  // Look up by the parsed number so non-canonical chapter strings such as
  // "01" still resolve to their verse count instead of `undefined`.
  const verseCount =
    versesMapping[Number(chapterId) as keyof typeof versesMapping];
  const parsedVerse = Number(verseId);
  return (
    Number.isInteger(parsedVerse) &&
    parsedVerse >= 1 &&
    parsedVerse <= verseCount
  );
};
