import { Juz } from '../../types';
import { fetcher } from './_fetcher';

/**
 * Get All Juzs
 * @description https://quran.api-docs.io/v4/juz/get-all-juzs
 * @example
 * quran.v4.juzs.findAll()
 */
const findAll = async () => {
  const { juzs } = await fetcher<{ juzs: Juz[] }>('/juzs');
  return juzs;
};

const juzs = { findAll };

export default juzs;
