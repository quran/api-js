import axios from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import stringify from '@/utils/qs-stringify';
import { removeBeginningSlash } from '@/utils/misc';

export const API_BASE_URL = 'https://api.quran.com/api/v4/';

export const makeUrl = (url: string, params?: Record<string, unknown>) => {
  const baseUrl = `${API_BASE_URL}${removeBeginningSlash(url)}`;
  if (!params) return baseUrl;

  const decamelizedKeys = decamelizeKeys(params);
  const paramsString = stringify(decamelizedKeys);
  if (!paramsString) return baseUrl;

  return `${baseUrl}?${paramsString}`;
};

export const fetcher = async <T extends object>(
  url: string,
  params: Record<string, unknown> = {}
) => {
  const res = await axios.get<T>(makeUrl(url, params));

  return camelizeKeys(res.data) as T;
};
