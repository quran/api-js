import type {
  BaseApiParams,
  ChapterId,
  HizbNumber,
  JuzNumber,
  PageNumber,
  PaginationParams,
  RubNumber,
  TranslationField,
  Verse,
  VerseField,
  VerseKey,
  WordField,
} from "@/types";
import {
  isValidChapterId,
  isValidHizb,
  isValidJuz,
  isValidQuranPage,
  isValidRub,
  isValidVerseKey,
} from "@/utils";

import type { QuranFetcher } from "./fetcher";

type GetVerseOptions = BaseApiParams &
  PaginationParams & {
    reciter?: string | number;
    words?: boolean;
    translations?: string[] | number[];
    tafsirs?: string[] | number[];
    wordFields?: Partial<Record<WordField, boolean>>;
    translationFields?: Partial<Record<TranslationField, boolean>>;
    fields?: Partial<Record<VerseField, boolean>>;
  };

/**
 * Verses API methods
 */
export class QuranVerses {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Get a specific verse by its key.
   * @param {VerseKey} key verse key in format "chapter:verse" (e.g., "1:1")
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findByKey('1:1')
   * client.verses.findByKey('2:255')
   */
  async findByKey(key: VerseKey, options?: GetVerseOptions): Promise<Verse> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    const { verse } = await this.fetcher.fetch<{ verse: Verse }>(
      `/verses/by_key/${key}`,
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verse;
  }

  /**
   * Get verses by chapter.
   * @param {ChapterId} id chapter id, minimum 1, maximum 114
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findByChapter('1')
   */
  async findByChapter(
    id: ChapterId,
    options?: GetVerseOptions,
  ): Promise<Verse[]> {
    if (!isValidChapterId(id)) throw new Error("Invalid chapter id");

    const { verses } = await this.fetcher.fetch<{ verses: Verse[] }>(
      `/verses/by_chapter/${id}`,
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verses;
  }

  /**
   * Get verses by page number.
   * @param {PageNumber} page page number
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findByPage('1')
   */
  async findByPage(
    page: PageNumber,
    options?: GetVerseOptions,
  ): Promise<Verse[]> {
    if (!isValidQuranPage(page)) throw new Error("Invalid page number");

    const { verses } = await this.fetcher.fetch<{ verses: Verse[] }>(
      `/verses/by_page/${page}`,
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verses;
  }

  /**
   * Get verses by juz number.
   * @param {JuzNumber} juz juz number
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findByJuz('1')
   */
  async findByJuz(juz: JuzNumber, options?: GetVerseOptions): Promise<Verse[]> {
    if (!isValidJuz(juz)) throw new Error("Invalid juz");

    const { verses } = await this.fetcher.fetch<{ verses: Verse[] }>(
      `/verses/by_juz/${juz}`,
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verses;
  }

  /**
   * Get verses by hizb number.
   * @param {HizbNumber} hizb hizb number
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findByHizb('1')
   */
  async findByHizb(
    hizb: HizbNumber,
    options?: GetVerseOptions,
  ): Promise<Verse[]> {
    if (!isValidHizb(hizb)) throw new Error("Invalid hizb");

    const { verses } = await this.fetcher.fetch<{ verses: Verse[] }>(
      `/verses/by_hizb/${hizb}`,
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verses;
  }

  /**
   * Get verses by rub number.
   * @param {RubNumber} rub rub number
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findByRub('1')
   */
  async findByRub(rub: RubNumber, options?: GetVerseOptions): Promise<Verse[]> {
    if (!isValidRub(rub)) throw new Error("Invalid rub");

    const { verses } = await this.fetcher.fetch<{ verses: Verse[] }>(
      `/verses/by_rub/${rub}`,
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verses;
  }

  /**
   * Get a random verse.
   * @param {GetVerseOptions} options
   * @example
   * client.verses.findRandom()
   */
  async findRandom(options?: GetVerseOptions): Promise<Verse> {
    const { verse } = await this.fetcher.fetch<{ verse: Verse }>(
      "/verses/random",
      {
        words: false, // verses-specific default
        ...options,
      },
    );

    return verse;
  }
}
