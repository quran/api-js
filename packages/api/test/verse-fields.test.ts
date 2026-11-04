import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../mocks/server";
import { testClient } from "./test-client";

const BY_KEY_URL =
  "https://apis.quran.foundation/content/api/v4/verses/by_key/:verse_key";

describe("Verse field selections", () => {
  it("requests the documented field names and types what they return", async () => {
    let requestUrl: URL | null = null;
    server.use(
      http.get(BY_KEY_URL, ({ request }) => {
        requestUrl = new URL(request.url);

        return HttpResponse.json({
          verse: {
            id: 2,
            verse_number: 2,
            verse_key: "1:2",
            page_number: 1,
            juz_number: 1,
            hizb_number: 1,
            rub_el_hizb_number: 1,
            sajdah_number: null,
            text_qpc_hafs: "verse-qpc-hafs",
            text_qpc_nastaleeq: "verse-qpc-nastaleeq",
            text_qpc_nastaleeq_hafs: "verse-qpc-nastaleeq-hafs",
            translations: [
              {
                id: 96493,
                manzil_number: 1,
                resource_id: 20,
                rub_el_hizb_number: 1,
                ruku_number: 1,
                text: "[All] praise is [due] to Allāh, Lord of the worlds -",
              },
            ],
            words: [
              {
                audio_url: "wbw/001_002_001.mp3",
                chapter_id: 1,
                char_type_name: "word",
                id: 1130,
                line_v1: 3,
                line_v2: 3,
                position: 1,
                text_indopak_nastaleeq: "word-indopak-nastaleeq",
                text_qpc_hafs: "word-qpc-hafs",
                text_uthmani_tajweed: "word-uthmani-tajweed",
                translation: {
                  language_name: "english",
                  text: "All praises and thanks",
                },
                transliteration: { language_name: "english", text: "al-ḥamdu" },
                verse_id: 2,
              },
            ],
          },
        });
      }),
    );

    const verse = await testClient.verses.findByKey("1:2", {
      fields: {
        pageNumber: true,
        textQpcHafs: true,
        textQpcNastaleeq: true,
        textQpcNastaleeqHafs: true,
      },
      translationFields: {
        id: true,
        manzilNumber: true,
        rubElHizbNumber: true,
        rukuNumber: true,
      },
      translations: [20],
      wordFields: {
        chapterId: true,
        lineNumber: true,
        lineV1: true,
        lineV2: true,
        textImlaeiSimple: true,
        textIndopakNastaleeq: true,
        textQpcHafs: true,
        textUthmaniSimple: true,
        textUthmaniTajweed: true,
        verseId: true,
      },
      words: true,
    });

    const params = requestUrl!.searchParams;
    expect(params.get("fields")).toBe(
      "page_number,text_qpc_hafs,text_qpc_nastaleeq,text_qpc_nastaleeq_hafs",
    );
    expect(params.get("translation_fields")).toBe(
      "id,manzil_number,rub_el_hizb_number,ruku_number",
    );
    expect(params.get("word_fields")).toBe(
      "chapter_id,line_number,line_v1,line_v2,text_imlaei_simple,text_indopak_nastaleeq,text_qpc_hafs,text_uthmani_simple,text_uthmani_tajweed,verse_id",
    );

    expect(verse.textQpcHafs).toBe("verse-qpc-hafs");
    expect(verse.textQpcNastaleeq).toBe("verse-qpc-nastaleeq");
    expect(verse.textQpcNastaleeqHafs).toBe("verse-qpc-nastaleeq-hafs");

    const word = verse.words?.[0];
    expect(word?.verseId).toBe(2);
    expect(word?.chapterId).toBe(1);
    expect(word?.lineV1).toBe(3);
    expect(word?.lineV2).toBe(3);
    expect(word?.textIndopakNastaleeq).toBe("word-indopak-nastaleeq");
    expect(word?.textQpcHafs).toBe("word-qpc-hafs");
    expect(word?.textUthmaniTajweed).toBe("word-uthmani-tajweed");

    const translation = verse.translations?.[0];
    expect(translation?.rubElHizbNumber).toBe(1);
    expect(translation?.rukuNumber).toBe(1);
    expect(translation?.manzilNumber).toBe(1);
  });
});
