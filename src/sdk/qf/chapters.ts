import { Chapter, ChapterId, ChapterInfo, Language } from '../../types';
import { fetcher } from './_fetcher';
import Utils from '../utils';
import { BaseApiOptions } from '../../types/BaseApiOptions';
import { mergeApiOptions } from '../../utils/misc';

type GetChapterOptions = Partial<BaseApiOptions>;

const defaultOptions: GetChapterOptions = {
  language: Language.ARABIC,
};

/**
 * Get all chapters.
 * @description https://api-docs.quran.foundation/docs/content_apis_versioned/list-chapters
 * @param {GetChapterOptions} options
 * @example
 * quran.v4.chapters.findAll()
 */
const findAll = async (options?: GetChapterOptions) => {
  const params = mergeApiOptions(defaultOptions, options);
  const { chapters } = await fetcher<{ chapters: Chapter[] }>(
    '/chapters',
    params,
    options?.fetchFn
  );

  return chapters;
};

/**
 * Get chapter by id.
 * @description https://api-docs.quran.foundation/docs/content_apis_versioned/get-chapter
 * @param {ChapterId} id chapter id, minimum 1, maximum 114
 * @param {GetChapterOptions} options
 * @example
 * quran.v4.chapters.findById('1')
 * quran.v4.chapters.findById('114')
 */
const findById = async (id: ChapterId, options?: GetChapterOptions) => {
  if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');

  const params = mergeApiOptions(defaultOptions, options);
  const { chapter } = await fetcher<{ chapter: Chapter }>(
    `/chapters/${id}`,
    params,
    options?.fetchFn
  );

  return chapter;
};

/**
 * Get chapter info by id.
 * @description https://api-docs.quran.foundation/docs/content_apis_versioned/info
 * @param {ChapterId} id chapter id, minimum 1, maximum 114
 * @param {GetChapterOptions} options
 * @example
 * quran.v4.chapters.findInfoById('1')
 * quran.v4.chapters.findInfoById('114')
 */
const findInfoById = async (id: ChapterId, options?: GetChapterOptions) => {
  if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');

  const params = mergeApiOptions(defaultOptions, options);
  const { chapterInfo } = await fetcher<{ chapterInfo: ChapterInfo }>(
    `/chapters/${id}/info`,
    params,
    options?.fetchFn
  );

  return chapterInfo;
};

const chapters = {
  findAll,
  findById,
  findInfoById,
};

export default chapters;
