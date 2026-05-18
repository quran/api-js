import type { VerseKey } from "../common/verse-key";

export interface Answer {
  id: string | number;
  body: string;
  answeredBy?: string;
  status: string;
  language?: string;
}

export interface AnswerQuestion {
  id: string | number;
  body: string;
  type: string;
  ranges: VerseKey[];
  surah: number;
  theme?: string[];
  summary?: string;
  references?: string[];
  language?: string;
  status: string;
  answers: Answer[];
}

export interface AnswersByAyahResponse {
  questions: AnswerQuestion[];
  totalCount?: number;
}

export interface AnswerCount {
  types?: Record<string, number>;
  total: number;
}

export type AnswerCountWithinRangeResponse = Record<string, AnswerCount>;
