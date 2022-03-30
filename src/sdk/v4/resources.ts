import {
  ChapterInfoResource,
  ChapterReciterResource,
  Language,
  LanguageResource,
  // RecitationInfoResource,
  RecitationResource,
  RecitationStylesResource,
  // TafsirInfoResource,
  TafsirResource,
  // TranslationInfoResource,
  TranslationResource,
  VerseMediaResource,
} from '../../types';
import { fetcher } from './_fetcher';

type GetResourceOptions = Partial<{
  language: Language;
}>;

const defaultOptions: GetResourceOptions = {
  language: Language.ARABIC,
};

const getResourcesOptions = (options: GetResourceOptions = {}) => {
  const final: any = { ...defaultOptions, ...options };
  return final;
};

/**
 * Get all recitations.
 * @description https://quran.api-docs.io/v4/resources/recitations
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllRecitations()
 */
const findAllRecitations = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { recitations } = await fetcher<{
    recitations: RecitationResource[];
  }>('/resources/recitations', params);

  return recitations;
};

// TODO: uncomment when API is ready
/**
 * Get all recitation info.
 * @description https://quran.api-docs.io/v4/resources/recitation-info
 * @param {string} id recitation id
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findRecitationInfo('1')
 */
// const findRecitationInfo = async (id: string, options?: GetResourceOptions) => {
//   const params = getResourcesOptions(options);
//   const { info } = await fetcher<{
//     info: RecitationInfoResource;
//   }>(`/resources/recitations/${id}/info`, params);

//   return info;
// };

/**
 * Get all translations.
 * @description https://quran.api-docs.io/v4/resources/translations
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllTranslations()
 */
const findAllTranslations = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { translations } = await fetcher<{
    translations: TranslationResource[];
  }>('/resources/translations', params);

  return translations;
};

// TODO: uncomment when API is ready
/**
 * Get translation info.
 * @description https://quran.api-docs.io/v4/resources/translation-info
 * @param {string} id translation id
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findTranslationInfo('169')
 */
// const findTranslationInfo = async (id: string, options?: GetResourceOptions) => {
//   const params = getResourcesOptions(options);
//   const { info } = await fetcher<{
//     info: TranslationInfoResource;
//   }>(`/resources/translations/${id}/info`, params);

//   return info;
// };

/**
 * Get all tafsirs.
 * @description https://quran.api-docs.io/v4/resources/tafsirs
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllTafsirs()
 */
const findAllTafsirs = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { tafsirs } = await fetcher<{
    tafsirs: TafsirResource[];
  }>('/resources/tafsirs', params);

  return tafsirs;
};

// TODO: uncomment when API is ready
/**
 * Get tafsir info.
 * @description https://quran.api-docs.io/v4/resources/tafsirs-info
 * @param {string} id tafsir id
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findTranslationInfo('1')
 */
// const findTafsirInfo = async (id: string, options?: GetResourceOptions) => {
//   const params = getResourcesOptions(options);
//   const { info } = await fetcher<{
//     info: TafsirInfoResource;
//   }>(`/resources/tafsirs/${id}/info`, params);

//   return info;
// };

/**
 * Get all recitation styles.
 * @description https://quran.api-docs.io/v4/resources/recitation-styles
 * @example
 * quran.v4.resources.findAllRecitationStyles()
 */
const findAllRecitationStyles = async () => {
  const { recitationStyles } = await fetcher<{
    recitationStyles: RecitationStylesResource;
  }>('/resources/recitation_styles');

  return recitationStyles;
};

/**
 * Get all languages.
 * @description https://quran.api-docs.io/v4/resources/languages
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllLanguages()
 */
const findAllLanguages = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { languages } = await fetcher<{
    languages: LanguageResource[];
  }>('/resources/languages', params);

  return languages;
};

/**
 * Get all chapter infos.
 * @description https://quran.api-docs.io/v4/resources/chapter-info
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllChapterInfos()
 */
const findAllChapterInfos = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { chapterInfos } = await fetcher<{
    chapterInfos: ChapterInfoResource[];
  }>('/resources/chapter_infos', params);

  return chapterInfos;
};

/**
 * Get verse media.
 * @description https://quran.api-docs.io/v4/resources/verse_media
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findVerseMedia()
 */
const findVerseMedia = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { verseMedia } = await fetcher<{
    verseMedia: VerseMediaResource;
  }>(`/resources/verse_media`, params);

  return verseMedia;
};

/**
 * Get all chapter reciters.
 * @description https://quran.api-docs.io/v4/resources/list-of-chapter-reciters
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllChapterReciters()
 */
const findAllChapterReciters = async (options?: GetResourceOptions) => {
  const params = getResourcesOptions(options);
  const { reciters } = await fetcher<{
    reciters: ChapterReciterResource[];
  }>(`/resources/chapter_reciters`, params);

  return reciters;
};

const resources = {
  findAllRecitations,
  findAllTranslations,
  findAllTafsirs,
  findAllRecitationStyles,
  findAllLanguages,
  findVerseMedia,
  findAllChapterReciters,
  findAllChapterInfos,
  // findRecitationInfo
  // findTranslationInfo
  // findTafsirInfo
};

export default resources;
