import { TranslatedName } from './TranslatedName';

export interface RecitationResource {
  id?: number;
  reciterName?: string;
  style?: string;
  translatedName?: TranslatedName;
}

export interface RecitationInfoResource {
  id?: number;
  info?: string;
}

export interface TranslationResource {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName?: TranslatedName;
}

export interface TranslationInfoResource {
  id?: number;
  info?: string;
}

export interface TafsirResource {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName?: TranslatedName;
}

export interface TafsirInfoResource {
  id?: number;
  info?: string;
}

export interface RecitationStylesResource {
  mujawwad: string;
  murattal: string;
  muallim: string;
}

export interface LanguageResource {
  id?: number;
  name?: string;
  nativeName?: string;
  isoCode?: string;
  direction?: string;
  translatedNames?: TranslatedName[];
}

export interface ChapterInfoResource {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName?: TranslatedName;
}

export interface VerseMediaResource {
  id?: number;
  name?: string;
  authorName?: string;
  languageName?: string;
}

export interface ChapterReciterResource {
  id: number;
  name: string;
  arabicName?: string;
  relativePath?: string;
  format?: string;
  filesSize?: number; // in kb
}
