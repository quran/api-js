import { Language, SearchResponse } from '@/types';
import { fetcher } from './_fetcher';

type SearchOptions = Partial<{
  language: Language;
  size: number;
  page: number;
}>;

const defaultSearchOptions: SearchOptions = {
  language: Language.ARABIC,
  size: 30,
};

const getSearchOptions = (q: string, options: SearchOptions = {}) => {
  const all = { ...defaultSearchOptions, ...options, q };
  return all;
};

/**
 * Search
 * @description https://quran.api-docs.io/v4/search/KfCmk4KQYbtyK9adj
 * @param q search query
 * @param options search options
 * @example
 * quran.v4.search.search('الله')
 * quran.v4.search.search('الله', { language: Language.ENGLISH })
 * quran.v4.search.search('الله', { language: Language.ENGLISH, size: 10 })
 * quran.v4.search.search('الله', { language: Language.ENGLISH, page: 2 })
 */
const search = async (q: string, options?: SearchOptions) => {
  const params = getSearchOptions(q, options);
  const { search } = await fetcher<SearchResponse>('/search', params);

  return search;
};

const searchApi = { search };

export default searchApi;
