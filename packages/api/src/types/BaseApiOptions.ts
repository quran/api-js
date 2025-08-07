import type { FetchFn, Language } from ".";

export interface BaseApiOptions {
  language: Language;
  fetchFn?: FetchFn;
}
