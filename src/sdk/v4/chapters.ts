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

const Chapters = {
  async findAll(options?: Options) {
    const params = getChapterOptions(options);
    const { chapters } = await fetcher<{ chapters: Chapter[] }>(
      '/chapters',
      params
    );

    return chapters;
  },
  async findById(id: ChapterId, options?: Options) {
    if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');

    const params = getChapterOptions(options);
    const { chapter } = await fetcher<{ chapter: Chapter }>(
      `/chapters/${id}`,
      params
    );

    return chapter;
  },
  async findInfoById(id: ChapterId, options?: Options) {
    if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');

    const params = getChapterOptions(options);
    const { chapterInfo } = await fetcher<{ chapterInfo: ChapterInfo }>(
      `/chapters/${id}/info`,
      params
    );

    return chapterInfo;
  },
};

export default Chapters;
