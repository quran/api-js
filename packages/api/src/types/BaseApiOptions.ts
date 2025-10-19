import type { CustomFetcher, Language } from ".";

export interface BaseApiOptions {
  language: Language;
  fetchFn?: CustomFetcher;
}
