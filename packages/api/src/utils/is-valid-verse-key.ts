import type { ChapterId, VerseKey } from "../types";
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
 */
export const isValidVerseKey = (key: string): key is VerseKey => {
  const [chapterId, verseId] = key.trim().split(":");
  if (!chapterId || !verseId || !isValidChapterId(chapterId)) return false;

  const parsedVerse = Number(verseId);
  const verseCount = versesMapping[chapterId as ChapterId];
  if (!parsedVerse || parsedVerse <= 0 || parsedVerse > verseCount)
    return false;

  return true;
};
