export interface SdkConfig {
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

let sdkConfig: SdkConfig;

export function configure(config: SdkConfig) {
  sdkConfig = config;
}

export function getConfig(): SdkConfig {
  if (!sdkConfig) {
    throw new Error('SDK not configured – call configure() first');
  }
  return sdkConfig;
}
