import retry from 'async-retry';
import dayjs from 'dayjs';
import { getConfig } from '../config';

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value; // still fresh
  }

  const { clientId, clientSecret, authBaseUrl, fetchFn } = getConfig();
  const doFetch = fetchFn ?? globalThis.fetch;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'content',
  }).toString();

  const res = await retry(
    () =>
      doFetch(`${authBaseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
      }),
    { retries: 3 }
  );

  if (!res.ok) throw new Error(`Token request failed: ${res.statusText}`);

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    value: json.access_token,
    expiresAt: dayjs().add(json.expires_in, 'second').valueOf(),
  };
  return cachedToken.value;
}
