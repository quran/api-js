import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import type { WordByWordTranslationSnapshotRecord } from "../src/types";
import { server } from "../mocks/server";
import { testClient } from "./test-client";

const VALID_RECITATION_ID = "1";
const VALID_TRANSLATION_ID = "1";
const VALID_TAFSIR_ID = "169";

const expectCapturedUrl = (url: URL | null): URL => {
  expect(url).not.toBeNull();
  return url!;
};

describe("Resources API", () => {
  describe("findAllChapterInfos()", () => {
    it("should return an array of chapter infos", async () => {
      const response = await testClient.resources.findAllChapterInfos();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllChapterReciters()", () => {
    it("should return an array of chapter reciters", async () => {
      const response = await testClient.resources.findAllChapterReciters();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllLanguages()", () => {
    it("should return an array of languages", async () => {
      const response = await testClient.resources.findAllLanguages();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllRecitationStyles()", () => {
    it("should return recitation styles (not an array)", async () => {
      const response = await testClient.resources.findAllRecitationStyles();
      expect(response).toBeDefined();
      // Note: This method returns an object, not an array despite containing "All" in name
      expect(response).not.toBeInstanceOf(Array);
    });
  });

  describe("findAllRecitations()", () => {
    it("should return an array of recitations", async () => {
      const response = await testClient.resources.findAllRecitations();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllTafsirs()", () => {
    it("should return an array of tafsirs", async () => {
      const response = await testClient.resources.findAllTafsirs();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findAllTranslations()", () => {
    it("should return an array of translations", async () => {
      const response = await testClient.resources.findAllTranslations();
      expect(response).toBeInstanceOf(Array);
      expect(response).toBeDefined();
    });
  });

  describe("findVerseMedia()", () => {
    it("should return verse media information", async () => {
      const response = await testClient.resources.findVerseMedia();
      expect(response).toBeDefined();
    });
  });

  describe("findRecitationInfo()", () => {
    it("should return recitation info for valid ID", async () => {
      const response =
        await testClient.resources.findRecitationInfo(VALID_RECITATION_ID);
      expect(response).toBeDefined();
    });
  });

  describe("findTranslationInfo()", () => {
    it("should return translation info for valid ID", async () => {
      const response =
        await testClient.resources.findTranslationInfo(VALID_TRANSLATION_ID);
      expect(response).toBeDefined();
    });
  });

  describe("findTafsirInfo()", () => {
    it("should return tafsir info for valid ID", async () => {
      const response =
        await testClient.resources.findTafsirInfo(VALID_TAFSIR_ID);
      expect(response).toBeDefined();
    });
  });

  describe("sync()", () => {
    it("serializes bootstrap sync request params", async () => {
      let requestUrl: URL | null = null;

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/resources/sync",
          ({ request }) => {
            requestUrl = new URL(request.url);
            return HttpResponse.json({
              sync: {
                sync_until_sequence: 1,
                has_more: false,
                next_page_url: null,
                next_sync_token: "sync-token-1",
                mutations: [],
              },
            });
          },
        ),
      );

      await testClient.resources.sync({
        bootstrap: true,
        resources: "articles:*;translations:1,6",
        perPage: 100,
      });

      const url = expectCapturedUrl(requestUrl);
      expect(url.pathname).toBe("/content/api/v4/resources/sync");
      expect(url.searchParams.get("bootstrap")).toBe("true");
      expect(url.searchParams.get("resources")).toBe(
        "articles:*;translations:1,6",
      );
      expect(url.searchParams.get("per_page")).toBe("100");
    });

    it("serializes incremental sync request params", async () => {
      let requestUrl: URL | null = null;

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/resources/sync",
          ({ request }) => {
            requestUrl = new URL(request.url);
            return HttpResponse.json({
              sync: {
                sync_until_sequence: 2,
                has_more: false,
                next_page_url: null,
                next_sync_token: "sync-token-2",
                mutations: [],
              },
            });
          },
        ),
      );

      await testClient.resources.sync({
        resources: "translations:19",
        syncToken: "sync-token-1",
        perPage: 50,
      });

      const url = expectCapturedUrl(requestUrl);
      expect(url.searchParams.get("resources")).toBe("translations:19");
      expect(url.searchParams.get("sync_token")).toBe("sync-token-1");
      expect(url.searchParams.get("per_page")).toBe("50");
      expect(url.searchParams.has("bootstrap")).toBe(false);
    });

    it("camel-cases sync mutation fields", async () => {
      const response = await testClient.resources.sync({
        resources: "translations:19",
        bootstrap: true,
      });

      expect(response.sync.syncUntilSequence).toBe(98100);
      expect(response.sync.nextSyncToken).toBe("sync-token-98100");
      expect(response.sync.hasMore).toBe(false);

      const mutation = response.sync.mutations[0];
      expect(mutation?.resourceGroup).toBe("translations");
      expect(mutation?.resourceContentId).toBe(19);
      expect(mutation?.recordType).toBe("translation");
      expect(mutation?.recordKey).toBe("85108");
      expect(mutation?.sourceRecordId).toBe(85108);
      expect(mutation?.changedAt).toBe("2026-05-05T10:00:00Z");
      expect(mutation?.snapshotUrl).toBeNull();
      expect(mutation?.unavailableReason).toBeNull();
      expect(mutation?.data?.verseKey).toBe("26:153");
    });

    it("exposes sync through content.v4.resources", async () => {
      const response = await testClient.content.v4.resources.sync({
        resources: "translations:19",
        bootstrap: true,
      });

      expect(response.sync.nextSyncToken).toBe("sync-token-98100");
    });
  });

  describe("findSnapshot()", () => {
    it("returns camel-cased word-by-word translation records", async () => {
      let requestUrl: URL | null = null;

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/resources/snapshots/word_by_word_translations/:id",
          ({ request, params }) => {
            requestUrl = new URL(request.url);
            return HttpResponse.json({
              resource_group: "word_by_word_translations",
              resource_id: Number(params.id),
              resource_content_id: Number(params.id),
              schema_version: 1,
              sync_sequence: 98101,
              records: [
                {
                  id: 1,
                  resource_content_id: 85,
                  resource_id: 85,
                  word_id: 1,
                  language_id: 38,
                  language_name: "english",
                  text: "In",
                  priority: 1,
                  updated_at: "2026-08-19T02:43:00Z",
                },
              ],
            });
          },
        ),
      );

      const snapshot =
        await testClient.resources.findSnapshot<WordByWordTranslationSnapshotRecord>(
          "word_by_word_translations",
          85,
        );

      const url = expectCapturedUrl(requestUrl);
      expect(url.pathname).toBe(
        "/content/api/v4/resources/snapshots/word_by_word_translations/85",
      );
      expect(snapshot.resourceGroup).toBe("word_by_word_translations");
      expect(snapshot.records).toEqual([
        {
          id: 1,
          resourceContentId: 85,
          resourceId: 85,
          wordId: 1,
          languageId: 38,
          languageName: "english",
          text: "In",
          priority: 1,
          updatedAt: "2026-08-19T02:43:00Z",
        },
      ]);
    });

    it("serializes snapshot path params", async () => {
      let requestUrl: URL | null = null;

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/resources/snapshots/:resourceGroup/:id",
          ({ request, params }) => {
            requestUrl = new URL(request.url);
            return HttpResponse.json({
              resource_group: params.resourceGroup,
              resource_id: Number(params.id),
              resource_content_id: Number(params.id),
              schema_version: 1,
              sync_sequence: 98100,
              records: [],
            });
          },
        ),
      );

      const snapshot = await testClient.content.v4.resources.findSnapshot(
        "translations",
        19,
      );

      const url = expectCapturedUrl(requestUrl);
      expect(url.pathname).toBe(
        "/content/api/v4/resources/snapshots/translations/19",
      );
      expect(snapshot.resourceGroup).toBe("translations");
      expect(snapshot.resourceId).toBe(19);
      expect(snapshot.resourceContentId).toBe(19);
      expect(snapshot.syncSequence).toBe(98100);
    });
  });
});
