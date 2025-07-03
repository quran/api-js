import { TranslatedName } from './TranslatedName';

export interface TafsirInfo {
  id?: number;
  name?: string;
  author_name?: string;
  slug?: string;
  language_name?: string;
  translated_name: TranslatedName;
}
