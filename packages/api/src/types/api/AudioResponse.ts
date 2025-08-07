import { Segment } from './Segment';

export interface AudioResponse {
  url?: string;
  duration?: number;
  format?: string;
  verseKey: string;
  segments?: Segment[];
}
