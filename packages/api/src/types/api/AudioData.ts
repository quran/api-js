import type { VerseKey } from "../common/verse-key";
import type { Segment } from "./Segment";

/**
 * Timing of one word in a chapter audio file: `[wordIndex, startMs, endMs]`. The word index
 * is one-based, and the times are milliseconds from the start of the file.
 *
 * Some legacy recitations return incomplete entries with only one or two numbers, such as
 * `[12231]`, so `startMs` and `endMs` can be missing. Skip an entry that is not a full
 * triplet, because its remaining positions are not reliable.
 */
export type ChapterRecitationSegment = [
  wordIndex: number,
  startMs?: number,
  endMs?: number,
];

/** Timing of one verse in a chapter audio file, in milliseconds from the start of the file. */
export interface ChapterRecitationTimestamp {
  verseKey: VerseKey;
  timestampFrom: number;
  timestampTo: number;
  /** Mirrors the source data, so it can be negative in legacy records. */
  duration: number;
  /** Word timings, returned when the request sets `segments: true`. */
  segments?: ChapterRecitationSegment[] | null;
}

export interface ChapterRecitation {
  id: number;
  chapterId: number;
  fileSize: number;
  format: string;
  audioUrl: string;
  /** Verse timings, present when the API has timing data for the file. */
  timestamps?: ChapterRecitationTimestamp[];
}

export interface VerseRecitation {
  verseKey: VerseKey;
  /** Relative URL path (e.g., "AbdulBaset/Murattal/mp3/002255.mp3") */
  url: string;
  /** Absolute URL when returned by SDK helpers (e.g., "https://verses.quran.com/AbdulBaset/Murattal/mp3/002255.mp3") */
  audioUrl?: string;

  id?: number;
  chapterId?: number;
  segments?: Segment[];
  format?: string;
}

export type NormalizedVerseRecitation = VerseRecitation & {
  audioUrl: string;
};
