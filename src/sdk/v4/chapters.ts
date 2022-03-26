import { Chapter, ChapterId, ChapterInfo, Language } from '@/types';
import { fetcher } from './_fetcher';
import Utils from '../utils';

type Options = Partial<{
  language: Language;
}>;

const defaultOptions: Options = {
  language: Language.ARABIC,
};

const getChapterOptions = (options: Options = {}) => {
  const final: any = { ...defaultOptions, ...options };
  return final;
};

/**
 * Get all chapters.
 * @description https://quran.api-docs.io/v4/chapters/list-chapters
 * @param {Options} options
 * @example
 * quran.v4.chapters.findAll()
 */
const findAll = async (options?: Options) => {
  const params = getChapterOptions(options);
  const { chapters } = await fetcher<{ chapters: Chapter[] }>(
    '/chapters',
    params
  );

  return chapters;
};

/**
 * Get chapter by id.
 * @description https://quran.api-docs.io/v4/chapters/get-chapter
 * @param {ChapterId} id chapter id, minimum 1, maximum 114
 * @param {Options} options
 * @example
 * quran.v4.chapters.findById('1')
 * quran.v4.chapters.findById('114')
 */
const findById = async (id: ChapterId, options?: Options) => {
  if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');

  const params = getChapterOptions(options);
  const { chapter } = await fetcher<{ chapter: Chapter }>(
    `/chapters/${id}`,
    params
  );

  return chapter;
};

/**
 * Get chapter info by id.
 * @description https://quran.api-docs.io/v4/chapters/chapter_info
 * @param {ChapterId} id chapter id, minimum 1, maximum 114
 * @param {Options} options
 * @example
 * quran.v4.chapters.findInfoById('1')
 * quran.v4.chapters.findInfoById('114')
 */
const findInfoById = async (id: ChapterId, options?: Options) => {
  if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');

  const params = getChapterOptions(options);
  const { chapterInfo } = await fetcher<{ chapterInfo: ChapterInfo }>(
    `/chapters/${id}/info`,
    params
  );

  return chapterInfo;
};

const chapters = {
  findAll,
  findById,
  findInfoById,
};

export default chapters;
