import { VerseKey } from '../VerseKey';
import { AudioResponse } from './AudioResponse';
import { Tafsir } from './Tafsir';
import { Translation } from './Translation';
import { Word } from './Word';

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
