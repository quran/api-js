import type { BaseApiParams, Chapter, ChapterId, ChapterInfo } from "@/types";
import { isValidChapterId } from "@/utils";

import type { QuranFetcher } from "./fetcher";

type GetChapterOptions = BaseApiParams;

/**
 * Chapters API methods
 */
export class QuranChapters {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Get all chapters.
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-chapters
   * @param {GetChapterOptions} options
   * @example
   * client.chapters.findAll()
   */
  async findAll(options?: GetChapterOptions): Promise<Chapter[]> {
    const { chapters } = await this.fetcher.fetch<{ chapters: Chapter[] }>(
      "/chapters",
      options,
    );

    return chapters;
  }

  /**
   * Get chapter by id.
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/get-chapter
   * @param {ChapterId} id chapter id, minimum 1, maximum 114
   * @param {GetChapterOptions} options
   * @example
   * client.chapters.findById('1')
   * client.chapters.findById('114')
   */
  async findById(id: ChapterId, options?: GetChapterOptions): Promise<Chapter> {
    if (!isValidChapterId(id)) throw new Error("Invalid chapter id");

    const { chapter } = await this.fetcher.fetch<{ chapter: Chapter }>(
      `/chapters/${id}`,
      options,
    );

    return chapter;
  }

  /**
   * Get chapter info by id.
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/get-chapter-info
   * @param {ChapterId} id chapter id, minimum 1, maximum 114
   * @param {GetChapterOptions} options
   * @example
   * client.chapters.findInfoById('1')
   * client.chapters.findInfoById('114')
   */
  async findInfoById(
    id: ChapterId,
    options?: GetChapterOptions,
  ): Promise<ChapterInfo> {
    if (!isValidChapterId(id)) throw new Error("Invalid chapter id");

    const { chapterInfo } = await this.fetcher.fetch<{
      chapterInfo: ChapterInfo;
    }>(`/chapters/${id}/info`, options);

    return chapterInfo;
  }
}
