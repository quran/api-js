export interface SdkConfig {
  clientId: string;
  clientSecret: string;
  contentBaseUrl?: string; // for /content/api/v4
  authBaseUrl?: string; // for /oauth2/token

  fetchFn?: typeof fetch;
}

let sdkConfig: SdkConfig;

export function configure(config: SdkConfig) {
  sdkConfig = {
    contentBaseUrl: 'https://apis.quran.foundation', // ✅ for all content endpoints
    authBaseUrl: 'https://oauth2.quran.foundation', // ✅ for token endpoint

    ...config,
  };
}

export function getConfig(): SdkConfig {
  if (!sdkConfig) {
    throw new Error('SDK not configured – call configure() first');
  }
  return sdkConfig;
}
