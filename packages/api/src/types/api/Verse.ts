import type { VerseKey } from "../common/verse-key";
import type { AudioResponse } from "./AudioResponse";
import type { Tafsir } from "./Tafsir";
import type { Translation } from "./Translation";
import type { Word } from "./Word";

export interface Verse {
  id: number;
  verseNumber: number;
  verseKey: VerseKey;
  chapterId?: number | string;
  pageNumber: number;
  juzNumber: number;
  hizbNumber: number;
  rubElHizbNumber: number;
  // verseIndex: number;
  words?: Word[];
  textUthmani?: string;
  textUthmaniSimple?: string;
  textUthmaniTajweed?: string;
  textImlaei?: string;
  textImlaeiSimple?: string;
  textIndopak?: string;
  textIndopakNastaleeq?: string;
  sajdahNumber: null;
  // sajdahType: null;
  imageUrl?: string;
  imageWidth?: number;
  v1Page?: number;
  v2Page?: number;
  codeV1?: string;
  codeV2?: string;
  translations?: Translation[];
  tafsirs?: Tafsir[];
  audio?: AudioResponse;
}
