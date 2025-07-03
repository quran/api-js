import { SearchResponse } from '../../types';
import { BaseApiOptions } from '../../types/BaseApiOptions';
import { mergeApiOptions } from '../../utils/misc';
import { fetcher } from './_fetcher';

type SearchOptions = Partial<
  BaseApiOptions & {
    q: string;
    size: number;
    page: number;
  }
>;

const defaultSearchOptions: SearchOptions = {
  size: 30,
};

/**
 * Search
 * @description https://api-docs.quran.foundation/docs/content_apis_versioned/search
 * @param {string} q search query
 * @param {SearchOptions} options
 * @example
 * quran.v4.search.search('نور')
 * quran.v4.search.search('نور', { language: Language.ENGLISH })
 * quran.v4.search.search('نور', { language: Language.ENGLISH, size: 10 })
 * quran.v4.search.search('نور', { language: Language.ENGLISH, page: 2 })
 */
const search = async (q: string, options?: SearchOptions) => {

  const params = mergeApiOptions(defaultSearchOptions, { q, ...options });

  const { search } = await fetcher<SearchResponse>(
    '/search',
    params,
    options?.fetchFn
  );

  return search;
};

const searchApi = { search };

export default searchApi;
