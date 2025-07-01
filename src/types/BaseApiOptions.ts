import { Language } from '.';

export interface BaseApiOptions {
  language: Language;
  fetchFn?: typeof fetch;
}
