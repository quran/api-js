import type { VerseKey } from "../VerseKey";
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
  audioUrl: string;
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
