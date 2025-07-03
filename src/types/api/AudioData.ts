import { VerseKey } from '../VerseKey';
import { Segment } from './Segment';

export interface ChapterRecitation {
  id: number;
  chapter_id: number;
  file_size: number;
  format: string;
  audio_url: string;
}

export interface VerseRecitation {
  verseKey: VerseKey;
  url: string;
  id?: number;
  chapter_id?: number;
  segments?: Segment[];
  format?: string;
}
