import type {
  BaseApiParams,
  ChapterId,
  HizbNumber,
  JuzNumber,
  PageNumber,
  QuranFetchClient,
  RubNumber,
  TafsirResponse,
  VerseKey,
} from "@/types";
import {
  isValidChapterId,
  isValidHizb,
  isValidJuz,
  isValidQuranPage,
  isValidRub,
  isValidVerseKey,
} from "@/utils";

type GetTafsirOptions = BaseApiParams & {
  chapterNumber?: ChapterId;
  fields?: string;
  page?: number;
  perPage?: number;
};

/**
 * Tafsir API methods
 */
export class QuranTafsir {
  constructor(private fetcher: QuranFetchClient) {}

  /**
   * Get a single tafsir.
   * @description https://api-docs.quran.foundation/docs/content_apis_versioned/tafsir/
   * @param {string | number} tafsirId tafsir id
   * @param {GetTafsirOptions} options
   * @example
   * client.tafsir.get('169', { chapterNumber: 1 })
   */
  async get(
    tafsirId: string | number,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/quran/tafsirs/${tafsirId}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific chapter.
   * @description https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-surah-tafsirs/
   * @param {string | number} resourceId tafsir resource id
   * @param {ChapterId} chapterNumber chapter id, minimum 1, maximum 114
   * @param {GetTafsirOptions} options
   * @example
   * client.tafsir.findByChapter('169', '1')
   */
  async findByChapter(
    resourceId: string | number,
    chapterNumber: ChapterId,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidChapterId(chapterNumber)) throw new Error("Invalid chapter id");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_chapter/${chapterNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific page.
   */
  async findByPage(
    resourceId: string | number,
    pageNumber: PageNumber,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidQuranPage(pageNumber)) throw new Error("Invalid page number");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_page/${pageNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific juz.
   */
  async findByJuz(
    resourceId: string | number,
    juzNumber: JuzNumber,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidJuz(juzNumber)) throw new Error("Invalid juz");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_juz/${juzNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific rub el hizb.
   */
  async findByRubElHizb(
    resourceId: string | number,
    rubElHizbNumber: RubNumber,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidRub(rubElHizbNumber)) throw new Error("Invalid rub number");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_rub_el_hizb/${rubElHizbNumber}`,
      options,
    );
  }

  /**
   * Alias for rub el hizb.
   */
  async findByRub(
    resourceId: string | number,
    rubNumber: RubNumber,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidRub(rubNumber)) throw new Error("Invalid rub number");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_rub/${rubNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific hizb.
   */
  async findByHizb(
    resourceId: string | number,
    hizbNumber: HizbNumber,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidHizb(hizbNumber)) throw new Error("Invalid hizb");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_hizb/${hizbNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific manzil.
   */
  async findByManzil(
    resourceId: string | number,
    manzilNumber: number | string,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_manzil/${manzilNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific ruku.
   */
  async findByRuku(
    resourceId: string | number,
    rukuNumber: number | string,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_ruku/${rukuNumber}`,
      options,
    );
  }

  /**
   * Get tafsirs for a specific ayah.
   */
  async findByAyah(
    resourceId: string | number,
    verseKey: VerseKey,
    options?: GetTafsirOptions,
  ): Promise<TafsirResponse> {
    if (!isValidVerseKey(verseKey)) throw new Error("Invalid verse key");

    return this.fetcher.fetch<TafsirResponse>(
      `/content/api/v4/tafsirs/${resourceId}/by_ayah/${verseKey}`,
      options,
    );
  }
}
