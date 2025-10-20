import { afterEach, describe, expect, it, vi } from "vitest";

import { QuranClient } from "../src";
import { QuranFetcher } from "../src/sdk/fetcher";
import { Language } from "../src/types";

const baseConfig = {
  clientId: "client-id",
  clientSecret: "client-secret",
};

describe("QuranClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes a cloned configuration object with resolved defaults", () => {
    const client = new QuranClient(baseConfig);

    const config = client.getConfig();

    expect(config.contentBaseUrl).toBe("https://apis.quran.foundation");
    expect(config.authBaseUrl).toBe("https://oauth2.quran.foundation");
    expect(config.defaults?.language).toBe(Language.ARABIC);
  });

  it("merges updates and forwards the new config to the fetcher", () => {
    const client = new QuranClient({
      ...baseConfig,
      defaults: {
        perPage: 10,
      },
    });

    const updateSpy = vi.spyOn(QuranFetcher.prototype, "updateConfig");

    client.updateConfig({
      contentBaseUrl: "https://custom.example.com",
      defaults: {
        language: Language.ENGLISH,
      },
    });

    const updatedConfig = client.getConfig();

    expect(updatedConfig.contentBaseUrl).toBe(
      "https://custom.example.com",
    );
    expect(updatedConfig.defaults?.language).toBe(Language.ENGLISH);
    expect(updatedConfig.defaults?.perPage).toBe(10);

    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        contentBaseUrl: "https://custom.example.com",
        defaults: expect.objectContaining({
          language: Language.ENGLISH,
          perPage: 10,
        }),
      }),
    );
  });

  it("delegates token clearing to the fetcher", () => {
    const client = new QuranClient(baseConfig);

    const clearSpy = vi.spyOn(
      QuranFetcher.prototype,
      "clearCachedToken",
    );

    client.clearCachedToken();

    expect(clearSpy).toHaveBeenCalledTimes(1);
  });
});
