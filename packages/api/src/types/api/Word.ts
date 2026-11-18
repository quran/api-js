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
  verseId?: number;
  chapterId?: number;
  textIndopakNastaleeq?: string | null;
  textImlaeiSimple?: string;
  textUthmaniSimple?: string;
  textUthmaniTajweed?: string;
  textQpcHafs?: string;
  v1Page?: number;
  v2Page?: number;
  lineV1?: number;
  lineV2?: number;
}
