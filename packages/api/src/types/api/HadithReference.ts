import type { VerseKey } from "../common/verse-key";

export interface HadithReference {
  id: number;
  collection: string;
  hadithNumber: string;
  ourHadithNumber: number;
  arabicUrn: number;
  englishUrn: number;
  surahNumber: number;
  ayahStartNumber: number;
  ayahEndNumber: number;
}

export interface HadithReferencesByAyahResponse {
  verseKey: VerseKey;
  verseNumber: number;
  chapterNumber: number;
  language: string;
  direction: string;
  hadithReferences: HadithReference[];
}

export interface HadithGrade {
  gradedBy?: string;
  grade?: string;
}

export interface HadithContent {
  lang: string;
  chapterNumber: string;
  chapterTitle: string;
  body: string;
  urn: number;
  grades: HadithGrade[];
}

export interface Hadith {
  urn: number;
  collection: string;
  bookNumber: string;
  chapterId: string;
  hadithNumber: string;
  name: string;
  hadith: HadithContent[];
}

export interface HadithsByAyahResponse {
  hadiths: Hadith[];
  page: number;
  limit: number;
  hasMore: boolean;
  language: string;
  direction: string;
}

export type HadithCountWithinRangeResponse = Record<string, number>;
