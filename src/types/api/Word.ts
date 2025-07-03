import { VerseKey } from '../VerseKey';
import { Translation } from './Translation';
import { Transliteration } from './Transliteration';

export enum CharType {
  Word = 'word',
  End = 'end',
  Pause = 'pause',
  Sajdah = 'sajdah',
  RubElHizb = 'rub-el-hizb',
}

export interface Word {
  id?: number;
  position: number;
  audio_url: string;
  char_type: CharType
  text_uthmani?: string;
  text_indopak?: string;
  text_imlaei?: string;
  verse_key?: VerseKey
  page_number?: number;
  line_number?: number;
  code_v1?: string;
  code_v2?: string;
  translation: Translation
  transliteration: Transliteration
  location?: string;
  v1_page?: number;
  v2_page?: number;
}
