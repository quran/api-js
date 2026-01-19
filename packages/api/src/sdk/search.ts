import type { SearchParams, SearchResponse } from "@/types";

import type { QuranFetcher } from "./fetcher";

type SearchOptions = Omit<SearchParams, "query">;

/**
 * Search API methods
 */
export class QuranSearch {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Search
   * @description /v1/search
   * @param {string} query search query
   * @param {SearchOptions} options
   * @example
   * client.search.search('نور', { mode: SearchMode.Quick })
   * client.search.search('نور', { mode: SearchMode.Advanced, exactMatchesOnly: '1' })
   * client.search.search('نور', { mode: SearchMode.Quick, size: 10 })
   * client.search.search('نور', { mode: SearchMode.Quick, page: 2 })
   */
  async search(query: string, options: SearchOptions): Promise<SearchResponse> {
    return this.fetcher.fetch<SearchResponse>("/v1/search", {
      query,
      size: 30, // search-specific default
      ...options,
    });
  }
}
