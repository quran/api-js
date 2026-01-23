import { http, HttpResponse } from "msw";

/**
 * Helper function to validate authentication headers
 *
 * @param request - The incoming request object
 * @returns True if authentication headers are valid
 * @throws Error if authentication headers are missing
 */
const validateAuth = (request: Request): boolean => {
  const authToken = request.headers.get("x-auth-token");
  const clientId = request.headers.get("x-client-id");

  if (!authToken || !clientId) {
    throw new Error("Missing authentication headers");
  }

  return true;
};

export const handlers = [
  // OAuth2 token endpoint for authentication
  http.post("https://oauth2.quran.foundation/oauth2/token", () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "content",
    });
  }),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/uthmani_tajweed",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_key: "1:1",
            text_uthmani_tajweed:
              "بِسْمِ <tajweed class=ham_wasl>ٱ</tajweed>للَّهِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّحْمَ<tajweed class=madda_normal>ـٰ</tajweed>نِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّح<tajweed class=madda_permissible>ِي</tajweed>مِ <span class=end>١</span>",
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/chapters",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          chapters: [
            {
              id: 1,
              revelation_place: "makkah",
              revelation_order: 5,
              bismillah_pre: false,
              name_simple: "Al-Fatihah",
              name_complex: "Al-Fātiĥah",
              name_arabic: "الفاتحة",
              verses_count: 7,
              pages: [1, 1],
              translated_name: {
                language_name: "english",
                name: "The Opener",
              },
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/translations",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          translations: [
            {
              id: 131,
              name: "Dr. Mustafa Khattab, the Clear Quran",
              author_name: "Dr. Mustafa Khattab",
              slug: "clearquran-with-tafsir",
              language_name: "english",
              translated_name: {
                name: "Dr. Mustafa Khattab",
                language_name: "english",
              },
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get("https://apis.quran.foundation/v1/search", ({ request }) => {
    try {
      validateAuth(request);
      return HttpResponse.json({
        result: {
          navigation: [
            {
              result_type: "surah",
              key: "1",
              name: "Al-Fatihah",
              arabic: "الفاتحة",
              isArabic: true,
            },
          ],
          verses: [],
        },
        pagination: {
          current_page: 1,
          next_page: null,
          per_page: 30,
          total_pages: 1,
          total_records: 1,
        },
      });
    } catch {
      return HttpResponse.text("Unauthorized", { status: 401 });
    }
  }),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/recitations",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          recitations: [
            {
              id: 1,
              reciter_name: "AbdulBaset AbdulSamad",
              style: "Mujawwad",
              translated_name: {
                name: "AbdulBaset AbdulSamad",
                language_name: "english",
              },
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  // Audio endpoints for chapter recitations
  http.get(
    "https://apis.quran.foundation/content/api/v4/chapter_recitations/:id",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          audio_files: [
            {
              id: 1,
              chapter_id: 1,
              file_size: 123456,
              format: "mp3",
              total_files: 114,
              recitation_id: params.id,
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/chapter_recitations/:id/:chapter_number",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          audio_file: {
            id: 1,
            chapter_id: params.chapter_number,
            file_size: 123456,
            format: "mp3",
            recitation_id: params.id,
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitationId/by_chapter/:chapterId",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          audioFiles: [
            {
              id: 1,
              chapter_id: params.chapterId,
              verse_key: "1:1",
              file_size: 123456,
              format: "mp3",
              recitation_id: params.recitationId,
            },
          ],
          pagination: {
            per_page: 50,
            current_page: 1,
            next_page: null,
            total_pages: 1,
            total_records: 1,
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitationId/by_ayah/:key",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          audioFiles: [
            {
              id: 1,
              verse_key: params.key,
              file_size: 123456,
              format: "mp3",
              recitation_id: params.recitationId,
            },
          ],
          pagination: {
            per_page: 50,
            current_page: 1,
            next_page: null,
            total_pages: 1,
            total_records: 1,
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  // Resource info endpoints
  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/recitations/:id/info",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          recitationInfo: {
            id: params.id,
            reciter_name: "AbdulBaset AbdulSamad",
            style: "Mujawwad",
            qirat: "Hafs",
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/translations/:id/info",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          translationInfo: {
            id: params.id,
            name: "Dr. Mustafa Khattab, the Clear Quran",
            author_name: "Dr. Mustafa Khattab",
            slug: "clearquran-with-tafsir",
            language_name: "english",
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/tafsirs/:id/info",
    ({ request, params }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          tafsirInfo: {
            id: params.id,
            name: "Tafsir Ibn Kathir",
            author_name: "Ibn Kathir",
            slug: "ibn-kathir",
            language_name: "arabic",
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  // Additional resource endpoints that were missing
  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/chapter_infos",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          chapterInfos: [
            {
              id: 1,
              chapter_id: 1,
              language_name: "english",
              short_text: "Brief info about Al-Fatihah",
              source: "Quran.com",
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/chapter_reciters",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          reciters: [
            {
              id: 1,
              reciter_name: "AbdulBaset AbdulSamad",
              style: "Mujawwad",
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/recitation_styles",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          recitationStyles: {
            mujawwad: "Mujawwad",
            murattal: "Murattal",
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/verse_media",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          verseMedia: {
            id: 1,
            verse_key: "1:1",
            media_type: "image",
            url: "https://example.com/verse-media.jpg",
          },
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/code_v2",
    () => {
      return HttpResponse.json({
        verses: [{ id: 1, verse_key: "1:1", code_v2: " ﱂ ﱃ ﱄ ﱅ", v2_page: 1 }],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitation_id/by_ayah/:ayah_key",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "AbdulBaset/Mujawwad/mp3/001001.mp3" },
          { verse_key: "1:2", url: "AbdulBaset/Mujawwad/mp3/001002.mp3" },
          { verse_key: "1:3", url: "AbdulBaset/Mujawwad/mp3/001003.mp3" },
        ],
        pagination: {
          per_page: 10,
          current_page: 1,
          next_page: 2,
          total_pages: 15,
          total_records: 148,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/code_v1",
    () => {
      return HttpResponse.json({
        verses: [{ id: 1, verse_key: "1:1", code_v1: "ﭑ ﭒ ﭓ ﭔ ﭕ", v1_page: 1 }],
      });
    },
  ),

  http.get("https://apis.quran.foundation/content/api/v4/verses/random", () => {
    return HttpResponse.json({
      verse: {
        id: 1,
        verse_number: 1,
        page_number: 1,
        verse_key: "1:1",
        juz_number: 1,
        hizb_number: 1,
        rub_number: 1,
        sajdah_type: null,
        sajdah_number: null,
        words: [
          {
            id: 1,
            position: 1,
            audio_url: "wbw/001_001_001.mp3",
            char_type_name: "word",
            line_number: 2,
            page_number: 1,
            code_v1: "&#xfb51;",
            translation: {
              text: "In (the) name",
              language_name: "english",
            },
            transliteration: { text: "bis'mi", language_name: "english" },
          },
        ],
        translations: [
          {
            resource_id: 131,
            text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
          },
        ],
        tafsirs: [
          {
            id: 82641,
            language_name: "english",
            name: "Tafsir Ibn Kathir",
            text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
          },
        ],
      },
    });
  }),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitation_id/by_juz/:juz_number",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "AbdulBaset/Mujawwad/mp3/001001.mp3" },
          { verse_key: "1:2", url: "AbdulBaset/Mujawwad/mp3/001002.mp3" },
          { verse_key: "1:3", url: "AbdulBaset/Mujawwad/mp3/001003.mp3" },
        ],
        pagination: {
          per_page: 10,
          current_page: 1,
          next_page: 2,
          total_pages: 2,
          total_records: 20,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/translations/:translation_id",
    () => {
      return HttpResponse.json({
        translations: [
          {
            resource_id: 131,
            text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
          },
        ],
        meta: {
          translation_name: "Dr. Mustafa Khattab, the Clear Quran",
          author_name: "Dr. Mustafa Khattab",
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/recitation_styles",
    () => {
      return HttpResponse.json({
        recitation_styles: {
          mujawwad: "Mujawwad is a melodic style of Holy Quran recitation",
          murattal: "Murattal is at a slower pace, used for study and practice",
          muallim: "Muallim is teaching style recitation of Holy Quran",
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/indopak",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_key: "1:1",
            text_indopak: "بِسۡمِ اللهِ الرَّحۡم]ٰنِ الرَّحِيۡمِ",
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitation_id/by_page/:page_number",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "AbdulBaset/Mujawwad/mp3/001001.mp3" },
          { verse_key: "1:2", url: "AbdulBaset/Mujawwad/mp3/001002.mp3" },
          { verse_key: "1:3", url: "AbdulBaset/Mujawwad/mp3/001003.mp3" },
        ],
        pagination: {
          per_page: 10,
          current_page: 1,
          next_page: 2,
          total_pages: 15,
          total_records: 148,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/verses/by_chapter/:chapter_number",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_number: 1,
            page_number: 1,
            verse_key: "1:1",
            juz_number: 1,
            hizb_number: 1,
            rub_number: 1,
            sajdah_type: null,
            sajdah_number: null,
            words: [
              {
                id: 1,
                position: 1,
                audio_url: "wbw/001_001_001.mp3",
                char_type_name: "word",
                line_number: 2,
                page_number: 1,
                code_v1: "&#xfb51;",
                translation: {
                  text: "In (the) name",
                  language_name: "english",
                },
                transliteration: { text: "bis'mi", language_name: "english" },
              },
            ],
            translations: [
              {
                resource_id: 131,
                text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
              },
            ],
            tafsirs: [
              {
                id: 82641,
                language_name: "english",
                name: "Tafsir Ibn Kathir",
                text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
              },
            ],
          },
        ],
        pagination: {
          per_page: 1,
          current_page: 1,
          next_page: 2,
          total_pages: 7,
          total_records: 7,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/chapters/:chapter_id/info",
    () => {
      return HttpResponse.json({
        chapterInfo: {
          id: 1,
          chapter_id: 1,
          language_name: "english",
          short_text:
            "This Surah is named Al-Fatihah because of its subject-matter. Fatihah is that which opens a subject or a book or any other thing. In other words, Al-Fatihah is a sort of preface.",
          source:
            "Sayyid Abul Ala Maududi - Tafhim al-Qur'an - The Meaning of the Quran",
          text: "<h2>Name</h2>\r\n<p>This Surah is named Al-Fatihah because of its subject-matter. Fatihah is that which opens a subject or a book or any other thing. In other words, Al-Fatihah is a sort of preface.</p>\r\n<h2>Period of Revelation</h2>...",
        },
      });
    },
  ),

  http.get("https://apis.quran.foundation/chapters/:chapter_id/info", () => {
    return HttpResponse.json({
      chapter_info: {
        id: 1,
        chapter_id: 1,
        language_name: "english",
        short_text:
          "This Surah is named Al-Fatihah because of its subject-matter. Fatihah is that which opens a subject or a book or any other thing. In other words, Al-Fatihah is a sort of preface.",
        source:
          "Sayyid Abul Ala Maududi - Tafhim al-Qur'an - The Meaning of the Quran",
        text: "<h2>Name</h2>\r\n<p>This Surah is named Al-Fatihah because of its subject-matter. Fatihah is that which opens a subject or a book or any other thing. In other words, Al-Fatihah is a sort of preface.</p>\r\n<h2>Period of Revelation</h2>...",
      },
    });
  }),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/chapter_infos",
    () => {
      return HttpResponse.json({
        chapter_infos: [
          {
            id: 155,
            name: "Hamza Roberto Piccardo",
            author_name: "Hamza Roberto Piccardo",
            slug: "hamza-roberto-piccardo-info",
            language_name: "italian",
            translated_name: {
              name: "Hamza Roberto Piccardo",
              language_name: "english",
            },
          },
          {
            id: 63,
            name: "Chapter Info",
            author_name: "Sayyid Abul Ala Maududi",
            slug: null,
            language_name: "malayalam",
            translated_name: {
              name: "Chapter Info",
              language_name: "english",
            },
          },
          {
            id: 62,
            name: "Chapter Info",
            author_name: "Sayyid Abul Ala Maududi",
            slug: null,
            language_name: "tamil",
            translated_name: {
              name: "Chapter Info",
              language_name: "english",
            },
          },
          {
            id: 61,
            name: "Chapter Info",
            author_name: "Sayyid Abul Ala Maududi",
            slug: null,
            language_name: "urdu",
            translated_name: {
              name: "Chapter Info",
              language_name: "english",
            },
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/verse_media",
    () => {
      return HttpResponse.json({
        verse_media: [
          {
            id: 64,
            name: "Bayyinah video commentary ",
            author_name: "Bayyinah",
            slug: "",
            language_name: "english",
            translated_name: {
              name: "Bayyinah video commentary ",
              language_name: "english",
            },
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/juzs",
    ({ request }) => {
      try {
        validateAuth(request);
        return HttpResponse.json({
          juzs: [
            {
              id: 1,
              juz_number: 1,
              verse_mapping: {
                1: "1-7",
                2: "1-141",
              },
              first_verse_id: 1,
              last_verse_id: 148,
              verses_count: 148,
            },
            {
              id: 2,
              juz_number: 2,
              verse_mapping: {
                2: "142-252",
              },
              first_verse_id: 149,
              last_verse_id: 259,
              verses_count: 111,
            },
            {
              id: 3,
              juz_number: 3,
              verse_mapping: {
                2: "253-286",
                3: "1-92",
              },
              first_verse_id: 260,
              last_verse_id: 385,
              verses_count: 126,
            },
            {
              id: 4,
              juz_number: 4,
              verse_mapping: {
                3: "93-200",
                4: "1-23",
              },
              first_verse_id: 386,
              last_verse_id: 516,
              verses_count: 131,
            },
            {
              id: 5,
              juz_number: 5,
              verse_mapping: {
                4: "24-147",
              },
              first_verse_id: 517,
              last_verse_id: 640,
              verses_count: 124,
            },
            {
              id: 6,
              juz_number: 6,
              verse_mapping: {
                4: "148-176",
                5: "1-81",
              },
              first_verse_id: 641,
              last_verse_id: 750,
              verses_count: 110,
            },
            {
              id: 7,
              juz_number: 7,
              verse_mapping: {
                5: "82-120",
                6: "1-110",
              },
              first_verse_id: 751,
              last_verse_id: 899,
              verses_count: 149,
            },
            {
              id: 8,
              juz_number: 8,
              verse_mapping: {
                6: "111-165",
                7: "1-87",
              },
              first_verse_id: 900,
              last_verse_id: 1041,
              verses_count: 142,
            },
            {
              id: 9,
              juz_number: 9,
              verse_mapping: {
                7: "88-206",
                8: "1-40",
              },
              first_verse_id: 1042,
              last_verse_id: 1200,
              verses_count: 159,
            },
            {
              id: 10,
              juz_number: 10,
              verse_mapping: {
                8: "41-75",
                9: "1-92",
              },
              first_verse_id: 1201,
              last_verse_id: 1327,
              verses_count: 127,
            },
            {
              id: 11,
              juz_number: 11,
              verse_mapping: {
                9: "93-129",
                10: "1-109",
                11: "1-5",
              },
              first_verse_id: 1328,
              last_verse_id: 1478,
              verses_count: 151,
            },
            {
              id: 12,
              juz_number: 12,
              verse_mapping: {
                11: "6-123",
                12: "1-52",
              },
              first_verse_id: 1479,
              last_verse_id: 1648,
              verses_count: 170,
            },
            {
              id: 13,
              juz_number: 13,
              verse_mapping: {
                12: "53-111",
                13: "1-43",
                14: "1-52",
              },
              first_verse_id: 1649,
              last_verse_id: 1802,
              verses_count: 154,
            },
            {
              id: 14,
              juz_number: 14,
              verse_mapping: {
                15: "1-99",
                16: "1-128",
              },
              first_verse_id: 1803,
              last_verse_id: 2029,
              verses_count: 227,
            },
            {
              id: 15,
              juz_number: 15,
              verse_mapping: {
                17: "1-111",
                18: "1-74",
              },
              first_verse_id: 2030,
              last_verse_id: 2214,
              verses_count: 185,
            },
            {
              id: 16,
              juz_number: 16,
              verse_mapping: {
                18: "75-110",
                19: "1-98",
                20: "1-135",
              },
              first_verse_id: 2215,
              last_verse_id: 2483,
              verses_count: 269,
            },
            {
              id: 17,
              juz_number: 17,
              verse_mapping: {
                21: "1-112",
                22: "1-78",
              },
              first_verse_id: 2484,
              last_verse_id: 2673,
              verses_count: 190,
            },
            {
              id: 18,
              juz_number: 18,
              verse_mapping: {
                23: "1-118",
                24: "1-64",
                25: "1-20",
              },
              first_verse_id: 2674,
              last_verse_id: 2875,
              verses_count: 202,
            },
            {
              id: 19,
              juz_number: 19,
              verse_mapping: {
                25: "21-77",
                26: "1-227",
                27: "1-55",
              },
              first_verse_id: 2876,
              last_verse_id: 3214,
              verses_count: 339,
            },
            {
              id: 20,
              juz_number: 20,
              verse_mapping: {
                27: "56-93",
                28: "1-88",
                29: "1-45",
              },
              first_verse_id: 3215,
              last_verse_id: 3385,
              verses_count: 171,
            },
            {
              id: 21,
              juz_number: 21,
              verse_mapping: {
                29: "46-69",
                30: "1-60",
                31: "1-34",
                32: "1-30",
                33: "1-30",
              },
              first_verse_id: 3386,
              last_verse_id: 3563,
              verses_count: 178,
            },
            {
              id: 22,
              juz_number: 22,
              verse_mapping: {
                33: "31-73",
                34: "1-54",
                35: "1-45",
                36: "1-27",
              },
              first_verse_id: 3564,
              last_verse_id: 3732,
              verses_count: 169,
            },
            {
              id: 23,
              juz_number: 23,
              verse_mapping: {
                36: "28-83",
                37: "1-182",
                38: "1-88",
                39: "1-31",
              },
              first_verse_id: 3733,
              last_verse_id: 4089,
              verses_count: 357,
            },
            {
              id: 24,
              juz_number: 24,
              verse_mapping: {
                39: "32-75",
                40: "1-85",
                41: "1-46",
              },
              first_verse_id: 4090,
              last_verse_id: 4264,
              verses_count: 175,
            },
            {
              id: 25,
              juz_number: 25,
              verse_mapping: {
                41: "47-54",
                42: "1-53",
                43: "1-89",
                44: "1-59",
                45: "1-37",
              },
              first_verse_id: 4265,
              last_verse_id: 4510,
              verses_count: 246,
            },
            {
              id: 26,
              juz_number: 26,
              verse_mapping: {
                46: "1-35",
                47: "1-38",
                48: "1-29",
                49: "1-18",
                50: "1-45",
                51: "1-30",
              },
              first_verse_id: 4511,
              last_verse_id: 4705,
              verses_count: 195,
            },
            {
              id: 27,
              juz_number: 27,
              verse_mapping: {
                51: "31-60",
                52: "1-49",
                53: "1-62",
                54: "1-55",
                55: "1-78",
                56: "1-96",
                57: "1-29",
              },
              first_verse_id: 4706,
              last_verse_id: 5104,
              verses_count: 399,
            },
            {
              id: 28,
              juz_number: 28,
              verse_mapping: {
                58: "1-22",
                59: "1-24",
                60: "1-13",
                61: "1-14",
                62: "1-11",
                63: "1-11",
                64: "1-18",
                65: "1-12",
                66: "1-12",
              },
              first_verse_id: 5105,
              last_verse_id: 5241,
              verses_count: 137,
            },
            {
              id: 29,
              juz_number: 29,
              verse_mapping: {
                67: "1-30",
                68: "1-52",
                69: "1-52",
                70: "1-44",
                71: "1-28",
                72: "1-28",
                73: "1-20",
                74: "1-56",
                75: "1-40",
                76: "1-31",
                77: "1-50",
              },
              first_verse_id: 5242,
              last_verse_id: 5672,
              verses_count: 431,
            },
            {
              id: 30,
              juz_number: 30,
              verse_mapping: {
                78: "1-40",
                79: "1-46",
                80: "1-42",
                81: "1-29",
                82: "1-19",
                83: "1-36",
                84: "1-25",
                85: "1-22",
                86: "1-17",
                87: "1-19",
                88: "1-26",
                89: "1-30",
                90: "1-20",
                91: "1-15",
                92: "1-21",
                93: "1-11",
                94: "1-8",
                95: "1-8",
                96: "1-19",
                97: "1-5",
                98: "1-8",
                99: "1-8",
                100: "1-11",
                101: "1-11",
                102: "1-8",
                103: "1-3",
                104: "1-9",
                105: "1-5",
                106: "1-4",
                107: "1-7",
                108: "1-3",
                109: "1-6",
                110: "1-3",
                111: "1-5",
                112: "1-4",
                113: "1-5",
                114: "1-6",
              },
              first_verse_id: 5673,
              last_verse_id: 6236,
              verses_count: 564,
            },
          ],
        });
      } catch {
        return HttpResponse.text("Unauthorized", { status: 401 });
      }
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/imlaei",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_key: "1:1",
            text_imlaei: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/translations/:translation_id/info",
    () => {
      return HttpResponse.json({ info: { id: 1, info: null } });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/uthmani",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_key: "1:1",
            text_uthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/tafsirs",
    () => {
      return HttpResponse.json({
        tafsirs: [
          {
            id: 169,
            name: "Tafsir Ibn Kathir",
            author_name: "Hafiz Ibn Kathir",
            slug: "en-tafisr-ibn-kathir",
            language_name: "english",
            translated_name: {
              name: "Tafsir Ibn Kathir",
              language_name: "english",
            },
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/tafsirs/:tafsir_id",
    () => {
      return HttpResponse.json({
        tafsirs: [
          {
            resource_id: 169,
            text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2><p>This Surah is called</p><p>-        Al-Fatihah, that is, the Opener of the Book, the Surah with which prayers are begun.',
          },
        ],
        meta: {
          tafsir_name: "Tafsir Ibn Kathir",
          author_name: "Hafiz Ibn Kathir",
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/recitations/:recitation_id/info",
    () => {
      return HttpResponse.json({ info: { id: 1, info: null } });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/recitations/:recitation_id",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "Alafasy/mp3/001001.mp3" },
          { verse_key: "1:2", url: "Alafasy/mp3/001002.mp3" },
          { verse_key: "1:3", url: "Alafasy/mp3/001003.mp3" },
          { verse_key: "1:4", url: "Alafasy/mp3/001004.mp3" },
          { verse_key: "1:5", url: "Alafasy/mp3/001005.mp3" },
          { verse_key: "1:6", url: "Alafasy/mp3/001006.mp3" },
          { verse_key: "1:7", url: "Alafasy/mp3/001007.mp3" },
        ],
        meta: {
          reciter_name: "Mishari Rashid al-`Afasy",
          recitation_style: null,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/chapter_reciters",
    () => {
      return HttpResponse.json({
        reciters: [
          {
            id: 3,
            name: "Abu Bakr al-Shatri",
            arabic_name: "أبو بكر الشاطرى",
            relative_path: "abu_bakr_ash-shaatree/",
            format: "mp3",
            files_size: 1258422528,
          },
          {
            id: 4,
            name: "Sa`ud ash-Shuraym",
            arabic_name: "سعود الشريم",
            relative_path: "sa3ood_al-shuraym/",
            format: "mp3",
            files_size: 1258422528,
          },
          {
            id: 5,
            name: "Mishari Rashid al-`Afasy",
            arabic_name: "مشاري راشد العفاسي",
            relative_path: "mishaari_raashid_al_3afaasee/",
            format: "mp3",
            files_size: 1258422528,
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/languages",
    () => {
      return HttpResponse.json({
        languages: [{ id: -71611860, iso_code: "amet" }],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/verses/by_hizb/:hizb_number",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_number: 1,
            page_number: 1,
            verse_key: "1:1",
            juz_number: 1,
            hizb_number: 1,
            rub_number: 1,
            sajdah_type: null,
            sajdah_number: null,
            words: [
              {
                id: 1,
                position: 1,
                audio_url: "wbw/001_001_001.mp3",
                char_type_name: "word",
                line_number: 2,
                page_number: 1,
                code_v1: "&#xfb51;",
                translation: {
                  text: "In (the) name",
                  language_name: "english",
                },
                transliteration: { text: "bis'mi", language_name: "english" },
              },
            ],
            translations: [
              {
                resource_id: 131,
                text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
              },
            ],
            tafsirs: [
              {
                id: 82641,
                language_name: "english",
                name: "Tafsir Ibn Kathir",
                text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
              },
            ],
          },
        ],
        pagination: {
          per_page: 1,
          current_page: 1,
          next_page: 2,
          total_pages: 7,
          total_records: 7,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/resources/tafsirs/:tafsir_id/info",
    ({ params }) => {
      const id = params.tafsir_id;
      if (!id || !Number.isInteger(Number(id)))
        return HttpResponse.json(
          { status: 404, error: "Tafsir not found" },
          { status: 404 },
        );

      return HttpResponse.json({
        info: {
          id: +id,
          info: "",
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitation_id/by_rub/:rub_number",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "AbdulBaset/Mujawwad/mp3/001001.mp3" },
          { verse_key: "1:2", url: "AbdulBaset/Mujawwad/mp3/001002.mp3" },
          { verse_key: "1:3", url: "AbdulBaset/Mujawwad/mp3/001003.mp3" },
        ],
        pagination: {
          per_page: 10,
          current_page: 1,
          next_page: 2,
          total_pages: 15,
          total_records: 148,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/quran/verses/uthmani_simple",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_key: "1:1",
            text_uthmani_simple: "بسم الله الرحمن الرحيم",
          },
        ],
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/verses/by_juz/:juz_number",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_number: 1,
            page_number: 1,
            verse_key: "1:1",
            juz_number: 1,
            hizb_number: 1,
            rub_number: 1,
            sajdah_type: null,
            sajdah_number: null,
            words: [
              {
                id: 1,
                position: 1,
                audio_url: "wbw/001_001_001.mp3",
                char_type_name: "word",
                line_number: 2,
                page_number: 1,
                code_v1: "&#xfb51;",
                translation: {
                  text: "In (the) name",
                  language_name: "english",
                },
                transliteration: { text: "bis'mi", language_name: "english" },
              },
            ],
            translations: [
              {
                resource_id: 131,
                text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
              },
            ],
            tafsirs: [
              {
                id: 82641,
                language_name: "english",
                name: "Tafsir Ibn Kathir",
                text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
              },
            ],
          },
        ],
        pagination: {
          per_page: 1,
          current_page: 1,
          next_page: 2,
          total_pages: 7,
          total_records: 7,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitation_id/by_chapter/:chapter_number",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "AbdulBaset/Mujawwad/mp3/001001.mp3" },
          { verse_key: "1:2", url: "AbdulBaset/Mujawwad/mp3/001002.mp3" },
          { verse_key: "1:3", url: "AbdulBaset/Mujawwad/mp3/001003.mp3" },
        ],
        pagination: {
          per_page: 10,
          current_page: 1,
          next_page: 2,
          total_pages: 2,
          total_records: 20,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/recitations/:recitation_id/by_hizb/:hizb_number",
    () => {
      return HttpResponse.json({
        audio_files: [
          { verse_key: "1:1", url: "AbdulBaset/Mujawwad/mp3/001001.mp3" },
          { verse_key: "1:2", url: "AbdulBaset/Mujawwad/mp3/001002.mp3" },
          { verse_key: "1:3", url: "AbdulBaset/Mujawwad/mp3/001003.mp3" },
        ],
        pagination: {
          per_page: 10,
          current_page: 1,
          next_page: 2,
          total_pages: 15,
          total_records: 148,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/verses/by_page/:page_number",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_number: 1,
            page_number: 1,
            verse_key: "1:1",
            juz_number: 1,
            hizb_number: 1,
            rub_number: 1,
            sajdah_type: null,
            sajdah_number: null,
            words: [
              {
                id: 1,
                position: 1,
                audio_url: "wbw/001_001_001.mp3",
                char_type_name: "word",
                line_number: 2,
                page_number: 1,
                code_v1: "&#xfb51;",
                translation: {
                  text: "In (the) name",
                  language_name: "english",
                },
                transliteration: { text: "bis'mi", language_name: "english" },
              },
            ],
            translations: [
              {
                resource_id: 131,
                text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
              },
            ],
            tafsirs: [
              {
                id: 82641,
                language_name: "english",
                name: "Tafsir Ibn Kathir",
                text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
              },
            ],
          },
        ],
        pagination: {
          per_page: 1,
          current_page: 1,
          next_page: 2,
          total_pages: 7,
          total_records: 7,
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/verses/by_key/:verse_key",
    () => {
      return HttpResponse.json({
        verse: {
          id: 1,
          verse_number: 1,
          page_number: 1,
          verse_key: "1:1",
          juz_number: 1,
          hizb_number: 1,
          rub_number: 1,
          sajdah_type: null,
          sajdah_number: null,
          words: [
            {
              id: 1,
              position: 1,
              audio_url: "wbw/001_001_001.mp3",
              char_type_name: "word",
              line_number: 2,
              page_number: 1,
              code_v1: "&#xfb51;",
              translation: {
                text: "In (the) name",
                language_name: "english",
              },
              transliteration: { text: "bis'mi", language_name: "english" },
            },
          ],
          translations: [
            {
              resource_id: 131,
              text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
            },
          ],
          tafsirs: [
            {
              id: 82641,
              language_name: "english",
              name: "Tafsir Ibn Kathir",
              text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
            },
          ],
        },
      });
    },
  ),

  http.get(
    "https://apis.quran.foundation/content/api/v4/verses/by_rub/:rub_number",
    () => {
      return HttpResponse.json({
        verses: [
          {
            id: 1,
            verse_number: 1,
            page_number: 1,
            verse_key: "1:1",
            juz_number: 1,
            hizb_number: 1,
            rub_number: 1,
            sajdah_type: null,
            sajdah_number: null,
            words: [
              {
                id: 1,
                position: 1,
                audio_url: "wbw/001_001_001.mp3",
                char_type_name: "word",
                line_number: 2,
                page_number: 1,
                code_v1: "&#xfb51;",
                translation: {
                  text: "In (the) name",
                  language_name: "english",
                },
                transliteration: { text: "bis'mi", language_name: "english" },
              },
            ],
            translations: [
              {
                resource_id: 131,
                text: "In the Name of Allah—the Most Compassionate, Most Merciful.",
              },
            ],
            tafsirs: [
              {
                id: 82641,
                language_name: "english",
                name: "Tafsir Ibn Kathir",
                text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
              },
            ],
          },
        ],
        pagination: {
          per_page: 1,
          current_page: 1,
          next_page: 2,
          total_pages: 7,
          total_records: 7,
        },
      });
    },
  ),

  http.get("https://apis.quran.foundation/content/api/v4/chapters/:id", () => {
    return HttpResponse.json({
      chapter: {
        id: 1,
        revelation_place: "makkah",
        revelation_order: 5,
        bismillah_pre: false,
        name_simple: "Al-Fatihah",
        name_complex: "Al-Fātiĥah",
        name_arabic: "الفاتحة",
        verses_count: 7,
        pages: [1, 1],
        translated_name: { language_name: "english", name: "The Opener" },
      },
    });
  }),
];
