import { VerseKey } from "../VerseKey";
import { Translation } from "./Translation";
import { Word } from "./Word";

export interface SearchResult {
  verse_key: VerseKey
  verse_id: number;
  text: string;
  highlighted?: string;
  words: Word[];
  translations: Translation[];
}
