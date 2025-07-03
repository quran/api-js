import { VerseKey } from '../VerseKey';

export interface Translation {
  id: number;
  text: string;
  resource_id: number;
  resource_name?: string;

  verse_id?: number;

  language_id?: number;
  language_name?: string;

  verse_key?: VerseKey;
  chapter_id?: number;
  verse_number?: number;
  juz_number?: number;
  hizb_number?: number;
  rub_number?: number;
  page_number?: number;
}
