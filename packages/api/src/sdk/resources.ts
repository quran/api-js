import type {
  BaseApiParams,
  ChapterInfoResource,
  ChapterReciterResource,
  LanguageResource,
  RecitationInfoResource,
  RecitationResource,
  RecitationStylesResource,
  TafsirInfoResource,
  TafsirResource,
  TranslationInfoResource,
  TranslationResource,
  VerseMediaResource,
} from "@/types";

import type { QuranFetcher } from "./fetcher";

type GetResourceOptions = BaseApiParams;

/**
 * Resources API methods
 */
export class QuranResources {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Get all recitations.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllRecitations()
   */
  async findAllRecitations(
    options?: GetResourceOptions,
  ): Promise<RecitationResource[]> {
    const { recitations } = await this.fetcher.fetch<{
      recitations: RecitationResource[];
    }>("/resources/recitations", options);

    return recitations;
  }

  /**
   * Get all translations.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllTranslations()
   */
  async findAllTranslations(
    options?: GetResourceOptions,
  ): Promise<TranslationResource[]> {
    const { translations } = await this.fetcher.fetch<{
      translations: TranslationResource[];
    }>("/resources/translations", options);

    return translations;
  }

  /**
   * Get all tafsirs.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllTafsirs()
   */
  async findAllTafsirs(
    options?: GetResourceOptions,
  ): Promise<TafsirResource[]> {
    const { tafsirs } = await this.fetcher.fetch<{
      tafsirs: TafsirResource[];
    }>("/resources/tafsirs", options);

    return tafsirs;
  }

  /**
   * Get all languages.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllLanguages()
   */
  async findAllLanguages(
    options?: GetResourceOptions,
  ): Promise<LanguageResource[]> {
    const { languages } = await this.fetcher.fetch<{
      languages: LanguageResource[];
    }>("/resources/languages", options);

    return languages;
  }

  /**
   * Get recitation info by id.
   * @param {string} id recitation id
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findRecitationInfo('1')
   */
  async findRecitationInfo(
    id: string,
    options?: GetResourceOptions,
  ): Promise<RecitationInfoResource> {
    const { recitationInfo } = await this.fetcher.fetch<{
      recitationInfo: RecitationInfoResource;
    }>(`/resources/recitations/${id}/info`, options);

    return recitationInfo;
  }

  /**
   * Get translation info by id.
   * @param {string} id translation id
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findTranslationInfo('131')
   */
  async findTranslationInfo(
    id: string,
    options?: GetResourceOptions,
  ): Promise<TranslationInfoResource> {
    const { translationInfo } = await this.fetcher.fetch<{
      translationInfo: TranslationInfoResource;
    }>(`/resources/translations/${id}/info`, options);

    return translationInfo;
  }

  /**
   * Get tafsir info by id.
   * @param {string} id tafsir id
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findTafsirInfo('171')
   */
  async findTafsirInfo(
    id: string,
    options?: GetResourceOptions,
  ): Promise<TafsirInfoResource> {
    const { tafsirInfo } = await this.fetcher.fetch<{
      tafsirInfo: TafsirInfoResource;
    }>(`/resources/tafsirs/${id}/info`, options);

    return tafsirInfo;
  }

  /**
   * Get all chapter infos.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllChapterInfos()
   */
  async findAllChapterInfos(
    options?: GetResourceOptions,
  ): Promise<ChapterInfoResource[]> {
    const { chapterInfos } = await this.fetcher.fetch<{
      chapterInfos: ChapterInfoResource[];
    }>("/resources/chapter_infos", options);

    return chapterInfos;
  }

  /**
   * Get all chapter reciters.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllChapterReciters()
   */
  async findAllChapterReciters(
    options?: GetResourceOptions,
  ): Promise<ChapterReciterResource[]> {
    const { reciters } = await this.fetcher.fetch<{
      reciters: ChapterReciterResource[];
    }>("/resources/chapter_reciters", options);

    return reciters;
  }

  /**
   * Get all recitation styles.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findAllRecitationStyles()
   */
  async findAllRecitationStyles(
    options?: GetResourceOptions,
  ): Promise<RecitationStylesResource> {
    const { recitationStyles } = await this.fetcher.fetch<{
      recitationStyles: RecitationStylesResource;
    }>("/resources/recitation_styles", options);

    return recitationStyles;
  }

  /**
   * Get verse media.
   * @param {GetResourceOptions} options
   * @example
   * client.resources.findVerseMedia()
   */
  async findVerseMedia(
    options?: GetResourceOptions,
  ): Promise<VerseMediaResource> {
    const { verseMedia } = await this.fetcher.fetch<{
      verseMedia: VerseMediaResource;
    }>("/resources/verse_media", options);

    return verseMedia;
  }
}
