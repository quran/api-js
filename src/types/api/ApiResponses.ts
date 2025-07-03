import { SearchResult } from "./searchResult";

export interface SearchResponse {
  search: {
    query: string;
    total_results: number;
    current_page: number;
    total_pages: number;
    results?: SearchResult[];
  };
}
