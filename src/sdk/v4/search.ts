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

const Search = {
  async search(q: string, options?: SearchOptions) {
    const params = getSearchOptions(q, options);
    const { search } = await fetcher<SearchResponse>('/search', params);

    return search;
  },
};

export default Search;
