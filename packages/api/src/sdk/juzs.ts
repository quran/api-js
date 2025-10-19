import type { Juz } from "@/types";

import type { QuranFetcher } from "./fetcher";

/**
 * Juzs API methods
 */
export class QuranJuzs {
  constructor(private fetcher: QuranFetcher) {}

  /**
   * Get All Juzs
   * @description https://api-docs.quran.com/docs/quran.com_versioned/4.0.0/juzs
   * @example
   * client.juzs.findAll()
   */
  async findAll(): Promise<Juz[]> {
    const { juzs } = await this.fetcher.fetch<{ juzs: Juz[] }>(
      "/content/api/v4/juzs",
    );
    return juzs;
  }
}
