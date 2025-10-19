import type { Translation } from "./Translation";
import type { Word } from "./Word";

export interface SearchResponse {
  search: {
    query: string;
    totalResults: number;
    currentPage: number;
    totalPages: number;
    results?: {
      verseKey: string;
      verse_id: number;
      text: string;
      highlighted: string;
      words: Word[];
      translations: Translation[];
    }[];
  };
}
