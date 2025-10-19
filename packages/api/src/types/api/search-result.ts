import type { VerseKey } from "../common/verse-key";
import type { Translation } from "./Translation";
import type { Word } from "./Word";

export interface SearchResult {
  verseKey: VerseKey;
  verseId: number;
  text: string;
  highlighted?: string;
  words: Word[];
  translations: Translation[];
}
