import type {
  BaseApiParams,
  Chapter,
  ChapterId,
  ChapterInfo,
  ChapterInfoResponse,
  QuranFetchClient,
} from "@/types";
import { isValidChapterId } from "@/utils";

type GetChapterOptions = BaseApiParams;
type GetChapterInfoOptions = BaseApiParams & {
  resourceId?: string | number;
  includeResources?: boolean;
};

/**
 * Chapters API methods
 */
export class QuranChapters {
  constructor(private fetcher: QuranFetchClient) {}

  /**
   * Get all chapters.
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/list-chapters
   * @param {GetChapterOptions} options
   * @example
   * client.chapters.findAll()
   */
  async findAll(options?: GetChapterOptions): Promise<Chapter[]> {
    const { chapters } = await this.fetcher.fetch<{ chapters: Chapter[] }>(
      "/content/api/v4/chapters",
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
      `/content/api/v4/chapters/${id}`,
      options,
    );

    return chapter;
  }

  /**
   * Get chapter info by id.
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/get-chapter-info
   * @param {ChapterId} id chapter id, minimum 1, maximum 114
   * @param {GetChapterInfoOptions} options
   * @example
   * client.chapters.findInfoById('1')
   * client.chapters.findInfoById('114')
   */
  async findInfoById(
    id: ChapterId,
    options?: GetChapterInfoOptions,
  ): Promise<ChapterInfo | null> {
    const { chapterInfo } = await this.findInfoResponseById(id, options);

    return chapterInfo;
  }

  /**
   * Get the full chapter info response, including available resources when requested.
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/get-chapter-info
   * @param {ChapterId} id chapter id, minimum 1, maximum 114
   * @param {GetChapterInfoOptions} options
   * @example
   * client.chapters.findInfoResponseById('1', { includeResources: true })
   * client.chapters.findInfoResponseById('1', { resourceId: 'en-tafsir-ibn-ashur' })
   */
  async findInfoResponseById(
    id: ChapterId,
    options?: GetChapterInfoOptions,
  ): Promise<ChapterInfoResponse> {
    if (!isValidChapterId(id)) throw new Error("Invalid chapter id");

    return this.fetcher.fetch<ChapterInfoResponse>(
      `/content/api/v4/chapters/${id}/info`,
      options,
    );
  }
}
