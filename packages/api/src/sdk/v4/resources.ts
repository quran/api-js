import {
  ChapterInfoResource,
  ChapterReciterResource,
  Language,
  LanguageResource,
  RecitationInfoResource,
  RecitationResource,
  RecitationStylesResource,
  TafsirInfoResource,
  TafsirResource,
  TranslationInfoResource,
  TranslationResource,
  VerseMediaResource,
} from '../../types';
import { BaseApiOptions } from '../../types/BaseApiOptions';
import { fetcher, mergeApiOptions } from './_fetcher';

type GetResourceOptions = Partial<BaseApiOptions>;

const defaultOptions: GetResourceOptions = {
  language: Language.ARABIC,
};

/**
 * Get all recitations.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/recitations
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllRecitations()
 */
const findAllRecitations = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options);
  const { recitations } = await fetcher<{
    recitations: RecitationResource[];
  }>('/resources/recitations', params, options?.fetchFn);

  return recitations;
};

/**
 * Get all recitation info.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/recitation-info
 * @param {string} id recitation id
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findRecitationInfo('1')
 */
const findRecitationInfo = async (id: string, options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { info } = await fetcher<{
    info: RecitationInfoResource;
  }>(`/resources/recitations/${id}/info`, params, options?.fetchFn);

  return info;
};

/**
 * Get all translations.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/translations
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllTranslations()
 */
const findAllTranslations = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { translations } = await fetcher<{
    translations: TranslationResource[];
  }>('/resources/translations', params, options?.fetchFn);

  return translations;
};

/**
 * Get translation info.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/translation-info
 * @param {string} id translation id
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findTranslationInfo('169')
 */
const findTranslationInfo = async (
  id: string,
  options?: GetResourceOptions
) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { info } = await fetcher<{
    info: TranslationInfoResource;
  }>(`/resources/translations/${id}/info`, params, options?.fetchFn);

  return info;
};

/**
 * Get all tafsirs.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/tafsirs
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllTafsirs()
 */
const findAllTafsirs = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { tafsirs } = await fetcher<{
    tafsirs: TafsirResource[];
  }>('/resources/tafsirs', params, options?.fetchFn);

  return tafsirs;
};

/**
 * Get tafsir info.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/tafsir-info
 * @param {string} id tafsir id
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findTafsirInfo('1')
 */
const findTafsirInfo = async (id: string, options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { info } = await fetcher<{
    info: TafsirInfoResource;
  }>(`/resources/tafsirs/${id}/info`, params, options?.fetchFn);

  return info;
};

/**
 * Get all recitation styles.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/recitation-styles
 * @example
 * quran.v4.resources.findAllRecitationStyles()
 */
const findAllRecitationStyles = async (
  options?: Omit<BaseApiOptions, 'language'>
) => {
  const { recitationStyles } = await fetcher<{
    recitationStyles: RecitationStylesResource;
  }>('/resources/recitation_styles', undefined, options?.fetchFn);

  return recitationStyles;
};

/**
 * Get all languages.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/languages
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllLanguages()
 */
const findAllLanguages = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { languages } = await fetcher<{
    languages: LanguageResource[];
  }>('/resources/languages', params, options?.fetchFn);

  return languages;
};

/**
 * Get all chapter infos.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/chapter-info
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllChapterInfos()
 */
const findAllChapterInfos = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { chapterInfos } = await fetcher<{
    chapterInfos: ChapterInfoResource[];
  }>('/resources/chapter_infos', params, options?.fetchFn);

  return chapterInfos;
};

/**
 * Get verse media.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/verse-media
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findVerseMedia()
 */
const findVerseMedia = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { verseMedia } = await fetcher<{
    verseMedia: VerseMediaResource;
  }>(`/resources/verse_media`, params, options?.fetchFn);

  return verseMedia;
};

/**
 * Get all chapter reciters.
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/chapter-reciters
 * @param {GetResourceOptions} options
 * @example
 * quran.v4.resources.findAllChapterReciters()
 */
const findAllChapterReciters = async (options?: GetResourceOptions) => {
  const params = mergeApiOptions(options, defaultOptions);
  const { reciters } = await fetcher<{
    reciters: ChapterReciterResource[];
  }>(`/resources/chapter_reciters`, params, options?.fetchFn);

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
  findRecitationInfo,
  findTranslationInfo,
  findTafsirInfo,
};

export default resources;
