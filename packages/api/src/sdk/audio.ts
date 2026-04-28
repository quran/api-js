import type {
  BaseApiParams,
  ChapterId,
  ChapterRecitation,
  NormalizedVerseRecitation,
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

type RawVerseRecitation = Omit<VerseRecitation, "audioUrl">;

/**
 * Base URL for verse audio files from Quran.com
 * Used to convert relative paths to absolute URLs
 */
const AUDIO_BASE_URL = "https://verses.quran.com";

/**
 * Normalize verse recitation data by adding absolute audioUrl
 * The API returns relative paths in the 'url' field, but we want
 * to provide absolute URLs for consistency with chapter recitations
 */
function normalizeVerseRecitations(
  audioFiles: RawVerseRecitation[],
): NormalizedVerseRecitation[] {
  return audioFiles.map((file) => {
    // If url is already absolute, use it; otherwise prepend the base URL
    const absoluteUrl =
      file.url.startsWith("http://") || file.url.startsWith("https://")
        ? file.url
        : `${AUDIO_BASE_URL}/${file.url.replace(/^\/+/, "")}`;

    return {
      ...file,
      audioUrl: absoluteUrl,
    };
  });
}

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
    }>(`/content/api/v4/chapter_recitations/${reciterId}`, options);

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
    }>(
      `/content/api/v4/chapter_recitations/${reciterId}/${chapterId}`,
      options,
    );

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
  ): Promise<{
    audioFiles: NormalizedVerseRecitation[];
    pagination: Pagination;
  }> {
    if (!isValidChapterId(chapterId)) throw new Error("Invalid chapter id");

    const data = await this.fetcher.fetch<{
      audioFiles: RawVerseRecitation[];
      pagination: Pagination;
    }>(
      `/content/api/v4/recitations/${recitationId}/by_chapter/${chapterId}`,
      options,
    );

    return {
      ...data,
      audioFiles: normalizeVerseRecitations(data.audioFiles),
    };
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
  ): Promise<{
    audioFiles: NormalizedVerseRecitation[];
    pagination: Pagination;
  }> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    const data = await this.fetcher.fetch<{
      audioFiles: RawVerseRecitation[];
      pagination: Pagination;
    }>(`/content/api/v4/recitations/${recitationId}/by_ayah/${key}`, options);

    return {
      ...data,
      audioFiles: normalizeVerseRecitations(data.audioFiles),
    };
  }
}
