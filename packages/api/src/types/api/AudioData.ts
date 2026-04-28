import type { VerseKey } from "../common/verse-key";
import type { Segment } from "./Segment";

export interface ChapterRecitation {
  id: number;
  chapterId: number;
  fileSize: number;
  format: string;
  audioUrl: string;
}

export interface VerseRecitation {
  verseKey: VerseKey;
  /** Relative URL path (e.g., "AbdulBaset/Murattal/mp3/002255.mp3") */
  url: string;
  /** Absolute URL (e.g., "https://verses.quran.com/AbdulBaset/Murattal/mp3/002255.mp3") */
  audioUrl: string;

  id?: number;
  chapterId?: number;
  segments?: Segment[];
  format?: string;
}
