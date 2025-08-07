import type {
  ChapterId,
  ChapterRecitation,
  HizbNumber,
  JuzNumber,
  PageNumber,
  Pagination,
  RubNumber,
  VerseKey,
  VerseRecitation,
  VerseRecitationField,
} from "@/types";
import type { BaseApiOptions } from "@/types/BaseApiOptions";
import { Language } from "@/types";
import {
  isValidChapterId,
  isValidHizb,
  isValidJuz,
  isValidQuranPage,
  isValidRub,
  isValidVerseKey,
} from "@/utils";

import { fetcher, mergeApiOptions } from "./_fetcher";

type GetChapterRecitationOptions = Partial<BaseApiOptions>;

const defaultChapterRecitationsOptions: GetChapterRecitationOptions = {
  language: Language.ARABIC,
};

type GetVerseRecitationOptions = Partial<
  BaseApiOptions & {
    fields: Partial<Record<VerseRecitationField, boolean>>;
  }
>;

const defaultVerseRecitationsOptions: GetVerseRecitationOptions = {
  language: Language.ARABIC,
};

/**
 * Get all chapter recitations for specific reciter
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/chapter-reciter-audio-files
 * @param {string} reciterId
 * @param {GetChapterRecitationOptions} options
 * @example
 * quran.v4.audio.findAllChapterRecitations('2')
 */
const findAllChapterRecitations = async (
  reciterId: string,
  options?: GetChapterRecitationOptions,
) => {
  const params = mergeApiOptions(options, defaultChapterRecitationsOptions);
  const { audioFiles } = await fetcher<{ audioFiles: ChapterRecitation[] }>(
    `/chapter_recitations/${reciterId}`,
    params,
    options?.fetchFn,
  );
  return audioFiles;
};

/**
 * Get chapter recitation for specific reciter and a specific chapter
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/chapter-reciter-audio-file
 * @param {ChapterId} chapterId
 * @param {string} reciterId
 * @param {GetChapterRecitationOptions} options
 * @example
 * quran.v4.audio.findChapterRecitationById('1', '2') // first chapter recitation for reciter 2
 */
const findChapterRecitationById = async (
  chapterId: ChapterId,
  reciterId: string,
  options?: GetChapterRecitationOptions,
) => {
  if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

  const params = mergeApiOptions(options, defaultChapterRecitationsOptions);
  const { audioFile } = await fetcher<{ audioFile: ChapterRecitation }>(
    `/chapter_recitations/${reciterId}/${chapterId}`,
    params,
    options?.fetchFn,
  );

  return audioFile;
};

/**
 * Get all verse audio files for a specific reciter and a specific chapter
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-surah-recitation
 * @param {ChapterId} chapterId
 * @param {string} recitationId
 * @param {GetVerseRecitationOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByChapter('1', '2')
 */
const findVerseRecitationsByChapter = async (
  chapterId: ChapterId,
  recitationId: string,
  options?: GetVerseRecitationOptions,
) => {
  if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

  const params = mergeApiOptions(options, defaultVerseRecitationsOptions);
  const data = await fetcher<{
    audioFiles: VerseRecitation[];
    pagination: Pagination;
  }>(
    `/recitations/${recitationId}/by_chapter/${chapterId}`,
    params,
    options?.fetchFn,
  );

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific juz
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-juz-recitaiton
 * @param {JuzNumber} juz
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByJuz('1', '2')
 */
const findVerseRecitationsByJuz = async (
  juz: JuzNumber,
  recitationId: string,
  options?: GetVerseRecitationOptions,
) => {
  if (!isValidJuz(juz)) throw new Error("Invalid juz");

  const params = mergeApiOptions(options, defaultVerseRecitationsOptions);
  const data = await fetcher<{
    audioFiles: VerseRecitation[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_juz/${juz}`, params, options?.fetchFn);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific mushaf page
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-page-recitaiton
 * @param {PageNumber} page
 * @param {string} recitationId
 * @param {GetVerseRecitationOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByPage('1', '2')
 */
const findVerseRecitationsByPage = async (
  page: PageNumber,
  recitationId: string,
  options?: GetVerseRecitationOptions,
) => {
  if (!isValidQuranPage(page)) throw new Error("Invalid page");

  const params = mergeApiOptions(options, defaultVerseRecitationsOptions);
  const data = await fetcher<{
    audioFiles: VerseRecitation[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_page/${page}`, params, options?.fetchFn);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific rub
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-rub-el-hizb-recitaiton
 * @param {RubNumber} rub
 * @param {string} recitationId
 * @param {GetVerseRecitationOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByRub('1', '2')
 */
const findVerseRecitationsByRub = async (
  rub: RubNumber,
  recitationId: string,
  options?: GetVerseRecitationOptions,
) => {
  if (!isValidRub(rub)) throw new Error("Invalid rub");

  const params = mergeApiOptions(options, defaultVerseRecitationsOptions);
  const data = await fetcher<{
    audioFiles: VerseRecitation[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_rub/${rub}`, params, options?.fetchFn);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific hizb
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-hizb-recitaiton
 * @param {HizbNumber} hizb
 * @param {string} recitationId
 * @param {GetVerseRecitationOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByHizb('1', '2')
 */
const findVerseRecitationsByHizb = async (
  hizb: HizbNumber,
  recitationId: string,
  options?: GetVerseRecitationOptions,
) => {
  if (!isValidHizb(hizb)) throw new Error("Invalid hizb");

  const params = mergeApiOptions(options, defaultVerseRecitationsOptions);
  const data = await fetcher<{
    audioFiles: VerseRecitation[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_hizb/${hizb}`, params, options?.fetchFn);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific verse
 * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-ayah-recitaiton
 * @param {VerseKey} key
 * @param {string} recitationId
 * @param {GetVerseRecitationOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByKey('1:1', '2')
 */
const findVerseRecitationsByKey = async (
  key: VerseKey,
  recitationId: string,
  options?: GetVerseRecitationOptions,
) => {
  if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

  const params = mergeApiOptions(options, defaultVerseRecitationsOptions);
  const data = await fetcher<{
    audioFiles: VerseRecitation[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_ayah/${key}`, params, options?.fetchFn);

  return data;
};

const audio = {
  findAllChapterRecitations,
  findChapterRecitationById,
  findVerseRecitationsByChapter,
  findVerseRecitationsByJuz,
  findVerseRecitationsByPage,
  findVerseRecitationsByRub,
  findVerseRecitationsByHizb,
  findVerseRecitationsByKey,
};

export default audio;
