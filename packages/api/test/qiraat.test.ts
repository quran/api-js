import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { createServerClient } from "../src/server";
import { testClient } from "./test-client";

describe("Qiraat API", () => {
  describe("readers", () => {
    it("should list readers", async () => {
      const response = await testClient.qiraat.findAllReaders();

      expect(response.meta.total).toBe(1);
      expect(response.readers[0]).toMatchObject({
        id: 1,
        abbreviation: "N",
        deathYearHijri: 169,
        deathYearGregorian: 785,
      });
      expect(response.readers[0]?.bio?.text).toBe("Reader of Medina.");
    });

    it("should send include as a comma-separated list", async () => {
      let requestUrl = "http://missing.test";

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/qiraat/readers",
          ({ request }) => {
            requestUrl = request.url;

            return HttpResponse.json({ readers: [], meta: { total: 0 } });
          },
        ),
      );

      await testClient.qiraat.findAllReaders({
        include: ["transmitters", "bio"],
      });

      expect(new URL(requestUrl).searchParams.get("include")).toBe(
        "transmitters,bio",
      );
    });

    it("should get a reader by id", async () => {
      const response = await testClient.qiraat.findReaderById(1);

      expect(response.reader.id).toBe(1);
      expect(response.reader.transmitters?.[0]?.isPrimary).toBe(true);
      expect(response.reader.bio?.shortText).toBe("Medina");
    });
  });

  describe("transmitters", () => {
    it("should list transmitters and snake-case the reader filter", async () => {
      let requestUrl = "http://missing.test";

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/qiraat/transmitters",
          ({ request }) => {
            requestUrl = request.url;

            return HttpResponse.json({
              transmitters: [
                {
                  id: 1,
                  name: "Qalun",
                  abbreviation: "Q",
                  is_primary: true,
                  position: 1,
                  reader: { id: 1, name: "Nafi'", abbreviation: "N" },
                },
              ],
              meta: { total: 1 },
            });
          },
        ),
      );

      const response = await testClient.qiraat.findAllTransmitters({
        readerId: 1,
      });

      expect(new URL(requestUrl).searchParams.get("reader_id")).toBe("1");
      expect(response.transmitters[0]?.isPrimary).toBe(true);
      expect(response.transmitters[0]?.reader?.name).toBe("Nafi'");
    });

    it("should get a transmitter by id", async () => {
      const response = await testClient.qiraat.findTransmitterById(1);

      expect(response.transmitter.id).toBe(1);
      expect(response.transmitter.reader?.id).toBe(1);
    });
  });

  describe("junctures", () => {
    it("should return junctures for a valid ayah key", async () => {
      const response = await testClient.qiraat.findJuncturesByVerse("1:4");

      expect(response.verse.verseKey).toBe("1:4");
      expect(response.meta.totalJunctures).toBe(1);
      expect(response.junctures[0]).toMatchObject({
        id: 7,
        readingsCount: 2,
        startWordPosition: 1,
      });
    });

    it("should throw for invalid ayah keys", async () => {
      await expect(
        // @ts-expect-error - invalid verse key
        testClient.qiraat.findJuncturesByVerse("0:1"),
      ).rejects.toThrowError("Invalid verse key");
    });

    it("should return paginated junctures for a chapter", async () => {
      let requestUrl = "http://missing.test";

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/qiraat/junctures/by_chapter/:chapter_number",
          ({ request }) => {
            requestUrl = request.url;

            return HttpResponse.json({
              chapter: { id: 1, chapter_number: 1, name_simple: "Al-Fatihah" },
              junctures: [],
              pagination: {
                current_page: 2,
                total_pages: 3,
                total_count: 5,
                per_page: 2,
              },
            });
          },
        ),
      );

      const response = await testClient.qiraat.findJuncturesByChapter(1, {
        page: 2,
        perPage: 2,
      });

      const params = new URL(requestUrl).searchParams;
      expect(params.get("page")).toBe("2");
      expect(params.get("per_page")).toBe("2");
      expect(response.chapter.nameSimple).toBe("Al-Fatihah");
      expect(response.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalCount: 5,
        perPage: 2,
      });
    });

    it("should throw for invalid chapter ids", async () => {
      await expect(
        // @ts-expect-error - invalid chapter id
        testClient.qiraat.findJuncturesByChapter(0),
      ).rejects.toThrowError("Invalid chapter id");
    });

    it("should get a juncture by id", async () => {
      const response = await testClient.qiraat.findJunctureById(7);

      expect(response.juncture.id).toBe(7);
      expect(response.juncture.readings).toHaveLength(2);
    });
  });

  describe("readings", () => {
    it("should get a reading by id with attributions", async () => {
      const response = await testClient.qiraat.findReadingById(70);

      expect(response.reading).toMatchObject({ id: 70, junctureId: 7 });
      expect(response.reading.attributedTo.readers[0]?.scope).toBe(
        "all_transmitters",
      );
    });
  });

  describe("matrix", () => {
    it("should return the matrix for a verse", async () => {
      const response = await testClient.qiraat.findMatrixByVerse("1:4", {
        textField: "text_imlaei",
      });

      expect(response.verse.verseKey).toBe("1:4");
      expect(response.meta.totalJunctures).toBe(1);
      expect(response.junctures[0]?.readings[0]?.matrix.cells[0]).toEqual({
        readerId: 1,
        transmitterId: null,
        type: "reader",
      });
    });

    it("should surface a 404 when a verse has no variations", async () => {
      await expect(
        testClient.qiraat.findMatrixByVerse("1:1"),
      ).rejects.toMatchObject({
        name: "QuranHttpError",
        status: 404,
      });
    });

    it("should return the matrix for a chapter", async () => {
      const response = await testClient.qiraat.findMatrixByChapter(1);

      expect(response.chapter.chapterNumber).toBe(1);
      expect(response.meta.textField).toBe("text_uthmani");
    });

    it("should return juncture counts for a verse range", async () => {
      let requestUrl = "http://missing.test";

      server.use(
        http.get(
          "https://apis.quran.foundation/content/api/v4/qiraat/matrix/count_within_range",
          ({ request }) => {
            requestUrl = request.url;

            return HttpResponse.json({ "1:4": 1, "2:10": 2 });
          },
        ),
      );

      await expect(
        testClient.qiraat.countMatrixWithinRange("1:1", "2:10"),
      ).resolves.toEqual({ "1:4": 1, "2:10": 2 });

      const params = new URL(requestUrl).searchParams;
      expect(params.get("from")).toBe("1:1");
      expect(params.get("to")).toBe("2:10");
    });

    it("should throw for invalid verse ranges", async () => {
      await expect(
        // @ts-expect-error - invalid verse key
        testClient.qiraat.countMatrixWithinRange("1:1", "0:1"),
      ).rejects.toThrowError("Invalid verse key");
    });
  });

  it("should expose the same methods through content.v4", async () => {
    const readers = await testClient.content.v4.qiraat.readers.list();
    const reader = await testClient.content.v4.qiraat.readers.get(1);
    const transmitters = await testClient.content.v4.qiraat.transmitters.list();
    const juncturesByVerse =
      await testClient.content.v4.qiraat.junctures.byVerse("1:4");
    const juncturesByChapter =
      await testClient.content.v4.qiraat.junctures.byChapter(1);
    const juncture = await testClient.content.v4.qiraat.junctures.get(7);
    const reading = await testClient.content.v4.qiraat.readings.get(70);
    const matrixByVerse =
      await testClient.content.v4.qiraat.matrix.byVerse("1:4");
    const matrixByChapter =
      await testClient.content.v4.qiraat.matrix.byChapter(1);
    const counts = await testClient.content.v4.qiraat.matrix.countWithinRange(
      "1:1",
      "2:10",
    );

    expect(readers.readers).toHaveLength(1);
    expect(reader.reader.id).toBe(1);
    expect(transmitters.transmitters).toHaveLength(1);
    expect(juncturesByVerse.junctures).toHaveLength(1);
    expect(juncturesByChapter.junctures).toHaveLength(1);
    expect(juncture.juncture.id).toBe(7);
    expect(reading.reading.id).toBe(70);
    expect(matrixByVerse.junctures).toHaveLength(1);
    expect(matrixByChapter.chapter.chapterNumber).toBe(1);
    expect(counts["2:10"]).toBe(2);
  });

  it("should request the qiraat.read scope for qiraat endpoints", async () => {
    const requestedScopes: string[] = [];

    server.use(
      http.post(
        "https://oauth2.quran.foundation/oauth2/token",
        async ({ request }) => {
          const scope =
            new URLSearchParams(await request.text()).get("scope") ?? "";
          requestedScopes.push(scope);

          return HttpResponse.json({
            access_token: `${scope}-token`,
            expires_in: 3600,
            scope,
            token_type: "Bearer",
          });
        },
      ),
      http.get(
        "https://apis.quran.foundation/content/api/v4/qiraat/readers",
        ({ request }) => {
          expect(request.headers.get("x-auth-token")).toBe("qiraat.read-token");

          return HttpResponse.json({ readers: [], meta: { total: 0 } });
        },
      ),
    );

    const client = createServerClient({
      clientId: "scope-client-id",
      clientSecret: "scope-client-secret",
    });

    await client.qiraat.findAllReaders();

    expect(requestedScopes).toEqual(["qiraat.read"]);
  });
});
