import { Juz } from '../../types';
import { BaseApiOptions } from '../../types/BaseApiOptions';
import { fetcher } from './_fetcher';

/**
 * Get All Juzs
 * @description https://quran.api-docs.io/v4/juz/get-all-juzs
 * @example
 * quran.v4.juzs.findAll()
 */
const findAll = async (options?: Omit<BaseApiOptions, 'language'>) => {
  const { juzs } = await fetcher<{ juzs: Juz[] }>(
    '/juzs',
    undefined,
    options?.fetchFn
  );
  return juzs;
};

const juzs = { findAll };

export default juzs;
