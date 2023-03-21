import { camelizeKeys, decamelize, decamelizeKeys } from 'humps';
import { FetchFn } from '../../types';
import { BaseApiOptions } from '../../types/BaseApiOptions';
import { removeBeginningSlash } from '../../utils/misc';

export const API_BASE_URL = 'https://api.quran.com/api/v4/';

export const makeUrl = (url: string, params?: Record<string, unknown>) => {
  const baseUrl = `${API_BASE_URL}${removeBeginningSlash(url)}`;
  if (!params) return baseUrl;

  const paramsWithDecamelizedKeys = decamelizeKeys(params) as Record<
    string,
    string
  >;
  const paramsString = new URLSearchParams(
    Object.entries(paramsWithDecamelizedKeys).filter(
      ([, value]) => value !== undefined
    )
  ).toString();
  if (!paramsString) return baseUrl;

  return `${baseUrl}?${paramsString}`;
};

export const fetcher = async <T extends object>(
  url: string,
  params: Record<string, unknown> = {},
  fetchFn?: FetchFn
) => {
  if (fetchFn) {
    const json = await fetchFn(makeUrl(url, params));
    return camelizeKeys(json) as T;
  }

  if (typeof fetch === 'undefined') {
    throw new Error('fetch is not defined');
  }

  // if there is no fetchFn, we use the global fetch
  const res = await fetch(makeUrl(url, params));

  if (!res.ok || res.status >= 400) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  return camelizeKeys(json) as T;
};

type MergeApiOptionsObject = Pick<BaseApiOptions, 'fetchFn'> & {
  fields?: Record<string, boolean>;
} & Record<string, unknown>;

export const mergeApiOptions = (
  options: MergeApiOptionsObject = {},
  defaultOptions: Record<string, unknown> = {}
) => {
  // we can set it to undefined because `makeUrl` will filter it out
  if (options.fetchFn) options.fetchFn = undefined;

  const final: Record<string, unknown> = {
    ...defaultOptions,
    ...options,
  };

  if (final.fields) {
    const fields: string[] = [];
    Object.entries(final.fields).forEach(([key, value]) => {
      if (value) fields.push(decamelize(key));
    });

    // convert `fields` to a string sperated by commas
    final.fields = fields.join(',');
  }

  return final;
};
