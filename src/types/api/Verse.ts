import { VerseKey } from '../VerseKey';
import { AudioResponse } from './AudioResponse';
import { Tafsir } from './Tafsir';
import { Translation } from './Translation';
import { Word } from './Word';

export interface Verse {
  id: number;
  verse_key: VerseKey;
  verse_number: number;
  chapter_id?: number | string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  words?: Word[];
  
  text_uthmani?: string;
  text_uthmani_simple?: string;
  text_uthmani_tajweed?: string;
  text_imlaei?: string;
  text_imlaei_simple?: string;
  text_indopak?: string;
  text_indopak_nastaleeq?: string;
  
  sajdah_number?: number | null;
  sajdah_type?: string | null;
  
  image_url?: string;
  image_width?: number;
  
  v1_page?: number;
  v2_page?: number;
  
  code_v1?: string;
  code_v2?: string;
  
  translations?: Translation[];
  tafsirs?: Tafsir[];
  audio?: AudioResponse;
}