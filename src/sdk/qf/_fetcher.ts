/* eslint-disable @typescript-eslint/no-explicit-any */
import humps from 'humps';
import { getAccessToken } from '../../auth/tokenManager';
import { getConfig } from '../../config';
import { removeBeginningSlash } from '../../utils/misc';

const { camelizeKeys, decamelizeKeys } = humps;

export const makeUrl = (url: string, params: Record<string, any> = {}) => {
  const { contentBaseUrl } = getConfig();
  const apiRoot = `${contentBaseUrl}/content/api/v4/`;
  const u = `${apiRoot}${removeBeginningSlash(url)}`;

  if (!Object.keys(params).length) return u;

  const qs = new URLSearchParams(
    Object.entries(decamelizeKeys(params)).filter(([, v]) => v !== undefined)
  ).toString();
  return qs ? `${u}?${qs}` : u;
};

export async function fetcher<T>(
  url: string,
  params?: Record<string, any>,
  fetchFn?: typeof fetch
): Promise<T> {
  const token = await getAccessToken(); // auto-refresh
  const { clientId } = getConfig();
  const doFetch = fetchFn ?? globalThis.fetch;

  const fullUrl = makeUrl(url, params);

  const res = await doFetch(fullUrl, {
    headers: {
      'x-auth-token': token,
      'x-client-id': clientId,
    },
  });

  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

  return camelizeKeys(await res.json()) as T;
}
