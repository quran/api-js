import type { BaseApiParams, Juz, QuranFetchClient } from "@/types";

type GetJuzsOptions = BaseApiParams & {
  /** Mushaf ID, which selects the verse mapping set the juzs are returned for. */
  mushaf?: number | string;
};

/**
 * Juzs API methods
 */
export class QuranJuzs {
  constructor(private fetcher: QuranFetchClient) {}

  /**
   * Get All Juzs
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/juzs
   * @param {GetJuzsOptions} options
   * @example
   * client.juzs.findAll()
   * client.juzs.findAll({ mushaf: 6 })
   */
  async findAll(options?: GetJuzsOptions): Promise<Juz[]> {
    const { juzs } = await this.fetcher.fetch<{ juzs: Juz[] }>(
      "/content/api/v4/juzs",
      options,
    );
    return juzs;
  }
}
