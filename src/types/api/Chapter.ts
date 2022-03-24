import { TranslatedName } from './TranslatedName';

export interface Chapter {
  id: number;
  versesCount: number;
  bismillahPre: boolean;
  revelationOrder: number;
  revelationPlace: string;
  pages: Array<number>;
  nameComplex: string;
  nameSimple: string;
  transliteratedName: string;
  nameArabic: string;
  translatedName: TranslatedName;
}
