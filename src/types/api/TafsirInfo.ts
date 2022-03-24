import { TranslatedName } from './TranslatedName';

export interface TafsirInfo {
  id?: number;
  name?: string;
  authorName?: string;
  slug?: string;
  languageName?: string;
  translatedName: TranslatedName;
}
