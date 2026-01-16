import type { SearchResult } from "./search-result";

export interface SearchResponse {
  pagination: {
    currentPage: number;
    nextPage: number | null;
    perPage: number;
    totalPages: number;
    totalRecords: number;
  };
  result?: {
    navigation: SearchResult[];
    verses: SearchResult[];
  };
}
