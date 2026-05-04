import type {
  BaseApiParams,
  HadithCountWithinRangeResponse,
  HadithReferencesByAyahResponse,
  HadithsByAyahResponse,
  QuranFetchClient,
  VerseKey,
} from "@/types";
import { isValidVerseKey } from "@/utils";

type GetHadithReferenceOptions = BaseApiParams;

type GetHadithsByAyahOptions = BaseApiParams & {
  page?: number;
  limit?: number;
};

type CountHadithsWithinRangeOptions = BaseApiParams;

/**
 * Hadith reference API methods.
 */
export class QuranHadithReferences {
  constructor(private fetcher: QuranFetchClient) {}

  /**
   * Get ordered hadith reference records linked to a specific ayah.
   * @param {VerseKey} key verse key in format "chapter:verse" (e.g., "12:12")
   * @param {GetHadithReferenceOptions} options
   * @example
   * client.hadithReferences.findByAyah("12:12")
   */
  async findByAyah(
    key: VerseKey,
    options?: GetHadithReferenceOptions,
  ): Promise<HadithReferencesByAyahResponse> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    return this.fetcher.fetch<HadithReferencesByAyahResponse>(
      `/content/api/v4/hadith_references/by_ayah/${key}`,
      options,
    );
  }

  /**
   * Get paginated hadith payloads linked to a specific ayah.
   * @param {VerseKey} key verse key in format "chapter:verse" (e.g., "12:12")
   * @param {GetHadithsByAyahOptions} options
   * @example
   * client.hadithReferences.findHadithsByAyah("12:12", { limit: 4 })
   */
  async findHadithsByAyah(
    key: VerseKey,
    options?: GetHadithsByAyahOptions,
  ): Promise<HadithsByAyahResponse> {
    if (!isValidVerseKey(key)) throw new Error("Invalid verse key");

    return this.fetcher.fetch<HadithsByAyahResponse>(
      `/content/api/v4/hadith_references/by_ayah/${key}/hadiths`,
      options,
    );
  }

  /**
   * Get a verse-key to hadith-count map within an inclusive ayah range.
   * @param {VerseKey} from start verse key in format "chapter:verse"
   * @param {VerseKey} to end verse key in format "chapter:verse"
   * @param {CountHadithsWithinRangeOptions} options
   * @example
   * client.hadithReferences.countWithinRange("12:12", "12:13")
   */
  async countWithinRange(
    from: VerseKey,
    to: VerseKey,
    options?: CountHadithsWithinRangeOptions,
  ): Promise<HadithCountWithinRangeResponse> {
    if (!isValidVerseKey(from) || !isValidVerseKey(to)) {
      throw new Error("Invalid verse key");
    }

    return this.fetcher.fetch<HadithCountWithinRangeResponse>(
      "/content/api/v4/hadith_references/count_within_range",
      {
        ...options,
        from,
        to,
      },
    );
  }
}
