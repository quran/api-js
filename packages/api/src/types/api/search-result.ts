export enum SearchNavigationType {
  SURAH = "surah",
  JUZ = "juz",
  HIZB = "hizb",
  AYAH = "ayah",
  RUB_EL_HIZB = "rub_el_hizb",
  SEARCH_PAGE = "search_page",
  PAGE = "page",
  RANGE = "range",
  QURAN_RANGE = "quran_range",
}

export interface SearchResult {
  resultType: SearchNavigationType;
  key: number | string;
  name: string;
  arabic?: string;
  isArabic?: boolean;
  isTransliteration?: boolean;
}
