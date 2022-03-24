import { Segment } from './Segment';

export interface VerseTiming {
  verseKey: string;
  timestampFrom: number;
  timestampTo: number;
  duration: number;
  segments: Segment[];
}
