import type { VerseKey } from "../common/verse-key";
import type { Translation } from "./Translation";
import type { Transliteration } from "./Transliteration";

export enum CharType {
  Word = "word",
  End = "end",
  Pause = "pause",
  Sajdah = "sajdah",
  RubElHizb = "rub-el-hizb",
}

export interface Word {
  id?: number;
  position: number;
  audioUrl: string; // Relative word-by-word audio path, e.g. wbw/001_001_001.mp3
  charTypeName: CharType;
  codeV1?: string;
  codeV2?: string;
  pageNumber?: number;
  lineNumber?: number;
  text?: string;
  textUthmani?: string;
  textIndopak?: string;
  textImlaei?: string;
  translation: Translation;
  transliteration: Transliteration;
  location?: string; // chapter:verse:word
  verseKey?: VerseKey;
}
