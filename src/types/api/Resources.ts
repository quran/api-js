import { TranslatedName } from './TranslatedName';

export interface RecitationResource {
  id: number;
  reciter_name: string;
  style: string;
  translated_name?: TranslatedName;
}

export interface RecitationInfoResource {
  id: number;
  info: string;
}

export interface TranslationResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

export interface TranslationInfoResource {
  id: number;
  info: string;
}

export interface TafsirResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

export interface TafsirInfoResource {
  id: number;
  info: string;
}

export interface RecitationStylesResource {
  mujawwad: 'Mujawwad is a melodic style of Holy Quran recitation';
  murattal: 'Murattal is at a slower pace, used for study and practice';
  muallim: 'Muallim is teaching style recitation of Holy Quran';
}

export interface LanguageResource {
  id: number;
  name: string;
  native_name: string;
  iso_code: string;
  direction: string;
  translations_count: number;
  translated_names: TranslatedName[];
}

export interface ChapterInfoResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;
}

export interface VerseMediaResource {
  id: number;
  name: string;
  author_name: string;
  slug: string;
  language_name: string;
  translated_name: TranslatedName;}

