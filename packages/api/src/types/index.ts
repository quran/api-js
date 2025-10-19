export enum Language {
  ARABIC = "ar",
  ENGLISH = "en",
  URDU = "ur",
  BENGALI = "bn",
  TURKISH = "tr",
  SPANISH = "es",
  GERMAN = "de",
  BOSNIAN = "bs",
  RUSSIAN = "ru",
  ALBANIAN_AL = "al",
  FRENCH = "fr",
  DUTCH = "nl",
  TAMIL = "ta",
  TAJIK = "tg",
  INDONESIAN = "id",
  UZBEK = "uz",
  VIETNAMESE = "vi",
  CHINESE = "zh",
  ITALIAN = "it",
  JAPANESE = "ja",
  MALAYALAM = "ml",
  AMHARIC = "am",
  KAZAKH = "kk",
  PORTUGUESE = "pt",
  TAGALOG = "tl",
  THAI = "th",
  KOREAN = "ko",
  HINDI = "hi",
  KURDISH = "ku",
  HAUSA = "ha",
  AZERI = "az",
  SWAHILI = "sw",
  PERSIAN = "fa",
  SERBIAN = "sr",
  MARANAO = "mrn",
  AMAZIGH = "zgh",
  ASSAMESE = "as",
  BULGARIAN = "bg",
  CHECHEN = "ce",
  CZECH = "cs",

  DIVEHI = "dv",
  DHIVEHI = "dv",
  MALDIVIAN = "dv",

  FINNISH = "fi",
  GUJAARATI = "gu",
  HEBREW = "he",
  GEORGIAN = "ka",
  CENTRAL_KHMER = "km",
  GANDA = "lg",
  MARATHI = "mr",
  YORUBA = "yo",
  MALAY = "ms",
  NEPALI = "ne",
  SWEDISH = "sv",
  TELUGU = "te",
  TATAR = "tt",

  UIGHUR = "ug",
  UYGHUR = "ug",

  UKRAINIAN = "uk",
  NORWEGIAN = "no",
  OROMO = "om",
  POLISH = "pl",
  PASHTO = "ps",
  ROMANIAN = "ro",
  SINDHI = "sd",
  NORTHERN_SAMI = "se",

  SINHALA = "si",
  SINHALESE = "si",

  SOMALI = "so",
  ALBANIAN_SQ = "sq",
}

export enum QuranFont {
  MadaniV1 = "code_v1",
  MadaniV2 = "code_v2",
  Uthmani = "text_uthmani",
}

export type VerseField =
  | "chapterId"
  | "textUthmani"
  | "textUthmaniSimple"
  | "textImlaei"
  | "textImlaeiSimple"
  | "textIndopak"
  | "textIndopakNastaleeq"
  | "textUthmaniTajweed"
  | "imageUrl"
  | "imageWidth"
  | "codeV1"
  | "codeV2"
  | "v1Page"
  | "v2Page";

export type WordField =
  | "v1Page"
  | "v2Page"
  | "textUthmani"
  | "textImlaei"
  | "textIndopak"
  | "verseKey"
  | "location"
  | "codeV1"
  | "codeV2";

export type TranslationField =
  | "resourceName"
  | "verseId"
  | "languageId"
  | "languageName"
  | "verseKey"
  | "chapterId"
  | "verseNumber"
  | "juzNumber"
  | "hizbNumber"
  | "rubNumber"
  | "pageNumber";

export type VerseRecitationField = "id" | "chapterId" | "segments" | "format";

export * from "./common/verse-key";
export * from "./common/chapter-id";
export * from "./common/hizb-number";
export * from "./common/juz-number";
export * from "./common/page-number";
export * from "./common/rub-number";

export * from "./api";
export * from "./BaseApiParams";
export * from "./quran-client";
