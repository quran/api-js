import { VerseKey } from '../VerseKey';
import { Segment } from './Segment';

export interface ChapterRecitation {
  id: number;
  chapterId: number;
  fileSize: number;
  format: string;
  audioUrl: string;
}

export interface VerseRecitation {
  verseKey: VerseKey;
  url: string;

  id?: number;
  chapterId?: number;
  segments?: Segment[];
  format?: string;
}
