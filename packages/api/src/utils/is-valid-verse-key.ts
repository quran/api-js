import type { VerseKey } from "../types";
import { isValidChapterId } from "./is-valid-chapter-id";
import { parseReferenceNumber } from "./parse-reference-number";
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
 * isValidVerseKey('01:1') // false (must be canonical, as sent to the API)
 */
export const isValidVerseKey = (key: string): key is VerseKey => {
  const parts = key.split(":");
  if (parts.length !== 2) return false;

  const [chapterId, verseId] = parts as [string, string];
  if (!isValidChapterId(chapterId)) return false;

  const parsedVerse = parseReferenceNumber(verseId);
  return parsedVerse !== null && parsedVerse <= versesMapping[chapterId];
};
