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
} from '@/types';
import { fetcher } from './_fetcher';

type GetResourcesOptions = Partial<{
  language: Language;
}>;

const defaultOptions: GetResourcesOptions = {
  language: Language.ARABIC,
};

const getResourcesOptions = (options: GetResourcesOptions = {}) => {
  const final: any = { ...defaultOptions, ...options };
  return final;
};

const Resources = {
  async findAllRecitations(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { recitations } = await fetcher<{
      recitations: RecitationResource[];
    }>('/resources/recitations', params);

    return recitations;
  },
  // TODO: uncomment when API is ready
  // async findRecitationInfo(id: string, options?: GetResourcesOptions) {
  //   const params = getResourcesOptions(options);
  //   const { info } = await fetcher<{
  //     info: RecitationInfoResource;
  //   }>(`/resources/recitations/${id}/info`, params);

  //   return info;
  // },
  async findAllTranslations(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { translations } = await fetcher<{
      translations: TranslationResource[];
    }>('/resources/translations', params);

    return translations;
  },
  // TODO: uncomment when API is ready
  // async findTranslationInfo(id: string, options?: GetResourcesOptions) {
  //   const params = getResourcesOptions(options);
  //   const { info } = await fetcher<{
  //     info: TranslationInfoResource;
  //   }>(`/resources/translations/${id}/info`, params);

  //   return info;
  // },
  async findAllTafsirs(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { tafsirs } = await fetcher<{
      tafsirs: TafsirResource[];
    }>('/resources/tafsirs', params);

    return tafsirs;
  },
  // TODO: uncomment when API is ready
  // async findTafsirInfo(id: string, options?: GetResourcesOptions) {
  //   const params = getResourcesOptions(options);
  //   const { info } = await fetcher<{
  //     info: TafsirInfoResource;
  //   }>(`/resources/tafsirs/${id}/info`, params);

  //   return info;
  // },
  async findAllRecitationStyles() {
    const { recitationStyles } = await fetcher<{
      recitationStyles: RecitationStylesResource;
    }>('/resources/recitation_styles');

    return recitationStyles;
  },
  async findAllLanguages(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { languages } = await fetcher<{
      languages: LanguageResource[];
    }>('/resources/languages', params);

    return languages;
  },
  async findAllChapterInfos(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { chapterInfos } = await fetcher<{
      chapterInfos: ChapterInfoResource[];
    }>('/resources/chapter_infos', params);

    return chapterInfos;
  },
  async findVerseMedia(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { verseMedia } = await fetcher<{
      verseMedia: VerseMediaResource;
    }>(`/resources/verse_media`, params);

    return verseMedia;
  },
  async findAllChapterReciters(options?: GetResourcesOptions) {
    const params = getResourcesOptions(options);
    const { reciters } = await fetcher<{
      reciters: ChapterReciterResource[];
    }>(`/resources/chapter_reciters`, params);

    return reciters;
  },
};

export default Resources;
