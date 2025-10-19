import type { VerseKey } from "../common/verse-key";

export interface Translation {
  id?: number;
  text: string;
  resourceId: number;
  resourceName?: string;

  verseId?: number;

  languageId?: number;
  languageName?: string;

  verseKey?: VerseKey;
  chapterId?: number;
  verseNumber?: number;
  juzNumber?: number;
  hizbNumber?: number;
  rubNumber?: number;
  pageNumber?: number;
}
