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

  if (typeof globalThis.fetch !== 'function') {
    throw new Error(
      'Looks like there is no global fetch function. Take a look at https://quranjs.com/techniques#custom-fetcher for more info.'
    );
  }

  // if there is no fetchFn, we use the global fetch
  const res = await globalThis.fetch(makeUrl(url, params));

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
  const clonedOptions = { ...options };

  // we can set it to undefined because `makeUrl` will filter it out
  if (clonedOptions.fetchFn) clonedOptions.fetchFn = undefined;

  const final: Record<string, unknown> = {
    ...defaultOptions,
    ...clonedOptions,
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
