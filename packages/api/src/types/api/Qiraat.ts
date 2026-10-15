import type { VerseKey } from "../common/verse-key";

export interface QiraatTranslatedName {
  name: string;
  languageName: string;
}

export interface QiraatReaderSummary {
  id: number;
  name: string;
  abbreviation: string;
}

export interface QiraatBio {
  text: string;
  /** Only returned by the single reader endpoint. */
  shortText?: string;
}

export interface QiraatTransmitterSummary {
  id: number;
  name: string;
  abbreviation: string;
  isPrimary: boolean;
}

export interface QiraatReader {
  id: number;
  name: string;
  abbreviation: string;
  deathYearHijri?: number | null;
  deathYearGregorian?: number | null;
  position: number;
  translatedName?: QiraatTranslatedName | string | null;
  /** Returned when the reader's transmitters are loaded (single reader, or `include=transmitters`). */
  transmitters?: QiraatTransmitterSummary[];
  bio?: QiraatBio;
}

export interface QiraatTransmitter {
  id: number;
  name: string;
  abbreviation: string;
  isPrimary: boolean;
  deathYearHijri?: number | null;
  deathYearGregorian?: number | null;
  position: number;
  translatedName?: QiraatTranslatedName | string | null;
  reader?: QiraatReaderSummary;
  /** Only returned by the single transmitter endpoint. */
  bio?: QiraatBio;
}

export type QiraatReaderInclude = "transmitters" | "bio";

export type QiraatJunctureInclude = "readings";

export interface QiraatReadersResponse {
  readers: QiraatReader[];
  meta: { total: number };
}

export interface QiraatReaderResponse {
  reader: QiraatReader;
}

export interface QiraatTransmittersResponse {
  transmitters: QiraatTransmitter[];
  meta: { total: number };
}

export interface QiraatTransmitterResponse {
  transmitter: QiraatTransmitter;
}

export interface QiraatPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface QiraatChapterSummary {
  id: number;
  chapterNumber: number;
  nameSimple: string;
}

export interface QiraatVerseSummary {
  verseKey: VerseKey;
  verseNumber: number;
  chapterNumber: number;
  textUthmani: string;
}

export interface QiraatJuncturePreviewReading {
  id: number;
  position: number;
  textUthmani: string;
  translation?: string;
}

export interface QiraatJuncture {
  id: number;
  verseKey: string;
  position: number;
  wordId?: number | null;
  wordPosition?: number | null;
  startWordPosition?: number | null;
  endWordPosition?: number | null;
  textUthmani?: string | null;
  textImlaei?: string | null;
  category?: string | null;
  flags?: unknown;
  explanation?: string;
  /** Only returned when requested with `include=readings`. */
  readings?: QiraatJuncturePreviewReading[];
  readingsCount: number;
}

export interface QiraatJuncturesByVerseResponse {
  verse: QiraatVerseSummary;
  junctures: QiraatJuncture[];
  meta: { totalJunctures: number };
}

export interface QiraatJuncturesByChapterResponse {
  chapter: QiraatChapterSummary;
  junctures: QiraatJuncture[];
  pagination: QiraatPagination;
}

export interface QiraatReadingExplanation {
  text: string;
  source?: string | null;
}

export interface QiraatJunctureReading {
  id: number;
  textUthmani?: string | null;
  textImlaei?: string | null;
  grammaticalForm?: string | null;
  rootLetters?: string | null;
  color?: string | null;
  translation?: string;
  transliteration?: string;
  explanations?: QiraatReadingExplanation[];
}

export interface QiraatJunctureDetail {
  id: number;
  verseKey: string;
  position: number;
  wordId?: number | null;
  wordPosition?: number | null;
  startWordPosition?: number | null;
  endWordPosition?: number | null;
  textUthmani?: string | null;
  textImlaei?: string | null;
  flags?: unknown;
  explanation?: string;
  readings: QiraatJunctureReading[];
  readingsCount: number;
}

export interface QiraatJunctureResponse {
  juncture: QiraatJunctureDetail;
}

export interface QiraatReadingAttributedReader {
  id: number;
  name?: string | null;
  abbreviation?: string | null;
  scope: string;
}

export interface QiraatReadingAttributedTransmitter {
  id: number;
  name?: string | null;
  abbreviation?: string | null;
  readerId: number;
  readerName?: string | null;
}

export interface QiraatReading {
  id: number;
  junctureId: number;
  verseKey: string;
  textUthmani?: string | null;
  textImlaei?: string | null;
  position: number;
  color?: string | null;
  translation?: string | null;
  transliteration?: string | null;
  explanation?: string | QiraatReadingExplanation | null;
  explanations?: QiraatReadingExplanation[];
  attributedTo: {
    readers: QiraatReadingAttributedReader[];
    transmitters: QiraatReadingAttributedTransmitter[];
  };
}

export interface QiraatReadingResponse {
  reading: QiraatReading;
}

export type QiraatMatrixTextField =
  | "text_uthmani"
  | "text_imlaei"
  | "text_qpc_hafs";

export interface QiraatMatrixCell {
  readerId: number;
  transmitterId: number | null;
  type: "reader" | "transmitter";
}

export interface QiraatMatrixAttribution {
  readers: number[];
  transmitters: number[];
  cells: QiraatMatrixCell[];
}

export interface QiraatMatrixReader {
  id: number;
  name: string;
  abbreviation: string;
  position: number;
  translatedName?: QiraatTranslatedName | string | null;
  city?: string | null;
  bio?: string | null;
}

export interface QiraatMatrixTransmitter {
  id: number;
  name: string;
  abbreviation: string;
  readerId: number;
  position: number;
  isPrimary: boolean;
  translatedName?: QiraatTranslatedName | string | null;
}

export interface QiraatMatrixExplanation {
  id?: number;
  text: string;
  source?: string | null;
}

export interface QiraatMatrixReading {
  id: number;
  position?: number;
  text: string | null;
  textUthmani?: string | null;
  textImlaei?: string | null;
  grammaticalForm?: string | null;
  rootLetters?: string | null;
  color?: string | null;
  translation?: string;
  translations?: Array<{ id: number; text: string; source?: string | null }>;
  transliteration?: string;
  explanation?: QiraatMatrixExplanation;
  explanations?: QiraatMatrixExplanation[];
  matrix: QiraatMatrixAttribution;
}

export interface QiraatMatrixSegment {
  id: number;
  verseKey: string;
  verseId: number;
  text: string | null;
  position: number;
}

export interface QiraatMatrixJuncture {
  id: number;
  position: number;
  verseKey: string | null;
  verseRange?: string | null;
  crossVerse?: boolean;
  text: string | null;
  textSimple?: string | null;
  category?: string | null;
  wordId?: number | null;
  wordPosition?: number | null;
  startWordPosition?: number | null;
  endWordPosition?: number | null;
  segments?: QiraatMatrixSegment[];
  readings: QiraatMatrixReading[];
  commentary?: string;
  combinedTranslation?: string;
}

export interface QiraatMatrixAdjacentVerse {
  verseKey: string;
  chapterId: number;
  verseId: number;
}

export interface QiraatMatrixByVerseResponse {
  verse: {
    verseKey: string;
    chapterNumber: number;
    verseNumber: number;
    text: string | null;
    textField: QiraatMatrixTextField;
  };
  navigation: {
    previousVerse: QiraatMatrixAdjacentVerse | null;
    nextVerse: QiraatMatrixAdjacentVerse | null;
  };
  readers: QiraatMatrixReader[];
  transmitters: QiraatMatrixTransmitter[];
  junctures: QiraatMatrixJuncture[];
  meta: {
    language: string;
    direction: string;
    textField: QiraatMatrixTextField;
    totalJunctures: number;
    totalReadings: number;
    generatedAt: string;
  };
}

export interface QiraatMatrixByChapterResponse {
  chapter: QiraatChapterSummary;
  readers: Array<
    Pick<QiraatMatrixReader, "id" | "name" | "abbreviation" | "position">
  >;
  transmitters: QiraatMatrixTransmitter[];
  junctures: QiraatMatrixJuncture[];
  pagination: QiraatPagination;
  meta: {
    language: string;
    direction: string;
    textField: QiraatMatrixTextField;
    generatedAt: string;
  };
}

/** Map of verse key to the number of approved junctures in that verse. */
export type QiraatMatrixCountWithinRangeResponse = Record<string, number>;
