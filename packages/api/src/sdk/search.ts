import type { SearchParams, SearchResponse } from "@/types";

import type { QuranFetcher } from "./fetcher";

type SearchOptions = SearchParams;

/**
 * Search API methods
 */
export class QuranSearch {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Search
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/search
   * @param {string} q search query
   * @param {SearchOptions} options
   * @example
   * client.search.search('نور')
   * client.search.search('نور', { language: Language.ENGLISH })
   * client.search.search('نور', { language: Language.ENGLISH, size: 10 })
   * client.search.search('نور', { language: Language.ENGLISH, page: 2 })
   */
  async search(
    q: string,
    options?: SearchOptions,
  ): Promise<SearchResponse["search"]> {
    const { search } = await this.fetcher.fetch<SearchResponse>("/search", {
      q,
      size: 30, // search-specific default
      ...options,
    });

    return search;
  }
}
