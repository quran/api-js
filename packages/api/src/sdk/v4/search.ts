import { Language, SearchResponse } from '../../types';
import { BaseApiOptions } from '../../types/BaseApiOptions';
import { fetcher, mergeApiOptions } from './_fetcher';

type SearchOptions = Partial<
  BaseApiOptions & {
    size: number;
    page: number;
  }
>;

const defaultSearchOptions: SearchOptions = {
  language: Language.ARABIC,
  size: 30,
};

/**
 * Search
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/search
 * @param {string} q search query
 * @param {SearchOptions} options
 * @example
 * quran.v4.search.search('نور')
 * quran.v4.search.search('نور', { language: Language.ENGLISH })
 * quran.v4.search.search('نور', { language: Language.ENGLISH, size: 10 })
 * quran.v4.search.search('نور', { language: Language.ENGLISH, page: 2 })
 */
const search = async (q: string, options?: SearchOptions) => {
  const params = mergeApiOptions({ q, ...options }, defaultSearchOptions);
  const { search } = await fetcher<SearchResponse>(
    '/search',
    params,
    options?.fetchFn
  );

  return search;
};

const searchApi = { search };

export default searchApi;
