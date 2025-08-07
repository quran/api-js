import type { QuranClientConfig } from "@/types";
import { Language } from "@/types";

import { QuranAudio } from "./audio";
import { QuranChapters } from "./chapters";
import { QuranFetcher } from "./fetcher";
import { QuranJuzs } from "./juzs";
import { QuranResources } from "./resources";
import { QuranSearch } from "./search";
import { QuranVerses } from "./verses";

/**
 * Main Quran API client
 */
export class QuranClient {
  private config: Required<
    Pick<QuranClientConfig, "contentBaseUrl" | "authBaseUrl">
  > &
    Omit<QuranClientConfig, "contentBaseUrl" | "authBaseUrl">;
  private fetcher: QuranFetcher;

  public readonly chapters: QuranChapters;
  public readonly verses: QuranVerses;
  public readonly juzs: QuranJuzs;
  public readonly audio: QuranAudio;
  public readonly resources: QuranResources;
  public readonly search: QuranSearch;

  constructor(config: QuranClientConfig) {
    // Resolve configuration with defaults
    this.config = {
      contentBaseUrl: "https://apis.quran.foundation",
      authBaseUrl: "https://oauth2.quran.foundation",
      ...config,
      defaults: {
        language: Language.ARABIC,
        ...config.defaults,
      },
    };

    // Initialize the fetcher
    this.fetcher = new QuranFetcher(this.config);

    // Initialize all API modules with the fetcher only
    this.chapters = new QuranChapters(this.fetcher);
    this.verses = new QuranVerses(this.fetcher);
    this.juzs = new QuranJuzs(this.fetcher);
    this.audio = new QuranAudio(this.fetcher);
    this.resources = new QuranResources(this.fetcher);
    this.search = new QuranSearch(this.fetcher);
  }

  /**
   * Get the current configuration
   */
  public getConfig(): QuranClientConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  public updateConfig(newConfig: Partial<QuranClientConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      defaults: {
        ...this.config.defaults,
        ...newConfig.defaults,
      },
    };

    // Update the fetcher with new config
    this.fetcher.updateConfig(this.config);
  }

  /**
   * Clear cached authentication token
   */
  public clearCachedToken(): void {
    this.fetcher.clearCachedToken();
  }
}
