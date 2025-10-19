import type {
  BaseApiParams,
  ChapterId,
  ChapterRecitation,
  Pagination,
  VerseKey,
  VerseRecitation,
  VerseRecitationField,
} from "@/types";
import { isValidChapterId, isValidVerseKey } from "@/utils";

import type { QuranFetcher } from "./fetcher";

type GetChapterRecitationOptions = BaseApiParams;

type GetVerseRecitationOptions = BaseApiParams & {
  fields?: Partial<Record<VerseRecitationField, boolean>>;
};

/**
 * Audio API methods
 */
export class QuranAudio {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Get all chapter recitations for specific reciter
   * @param {string} reciterId
   * @param {GetChapterRecitationOptions} options
   * @example
   * client.audio.findAllChapterRecitations('2')
   */
  async findAllChapterRecitations(
    reciterId: string,
    options?: GetChapterRecitationOptions,
  ): Promise<ChapterRecitation[]> {
    const { audioFiles } = await this.fetcher.fetch<{
      audioFiles: ChapterRecitation[];
    }>(`/content/api/v4/recitations/${reciterId}`, options);

    return audioFiles;
  }

  /**
   * Get a specific chapter recitation by reciter and chapter
   * @param {string} reciterId
   * @param {ChapterId} chapterId
   * @param {GetChapterRecitationOptions} options
   * @example
   * client.audio.findChapterRecitationById('2', '1')
   */
  async findChapterRecitationById(
    reciterId: string,
    chapterId: ChapterId,
    options?: GetChapterRecitationOptions,
  ): Promise<ChapterRecitation> {
    if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

    const { audioFile } = await this.fetcher.fetch<{
      audioFile: ChapterRecitation;
    }>(`/content/api/v4/recitations/${reciterId}/${chapterId}`, options);

    return audioFile;
  }

  /**
   * Get verse recitations by chapter
   * @param {ChapterId} chapterId
   * @param {string} recitationId
   * @param {GetVerseRecitationOptions} options
   * @example
   * client.audio.findVerseRecitationsByChapter('1', '2')
   */
  async findVerseRecitationsByChapter(
    chapterId: ChapterId,
    recitationId: string,
    options?: GetVerseRecitationOptions,
  ): Promise<{ audioFiles: VerseRecitation[]; pagination: Pagination }> {
    if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

    const data = await this.fetcher.fetch<{
      audioFiles: VerseRecitation[];
      pagination: Pagination;
    }>(
      `/content/api/v4/recitations/${recitationId}/by_chapter/${chapterId}`,
      options,
    );

    return data;
  }

  /**
   * Get verse recitations by verse key
   * @param {VerseKey} key
   * @param {string} recitationId
   * @param {GetVerseRecitationOptions} options
   * @example
   * client.audio.findVerseRecitationsByKey('1:1', '2')
   */
  async findVerseRecitationsByKey(
    key: VerseKey,
    recitationId: string,
    options?: GetVerseRecitationOptions,
  ): Promise<{ audioFiles: VerseRecitation[]; pagination: Pagination }> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    const data = await this.fetcher.fetch<{
      audioFiles: VerseRecitation[];
      pagination: Pagination;
    }>(`/content/api/v4/recitations/${recitationId}/by_ayah/${key}`, options);

    return data;
  }
}
