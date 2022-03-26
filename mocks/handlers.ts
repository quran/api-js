import { rest } from 'msw';

export const handlers = [
  rest.get(
    'https://api.quran.com/api/v4/quran/verses/uthmani_tajweed',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_key: '1:1',
              text_uthmani_tajweed:
                'بِسْمِ <tajweed class=ham_wasl>ٱ</tajweed>للَّهِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّحْمَ<tajweed class=madda_normal>ـٰ</tajweed>نِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّح<tajweed class=madda_permissible>ِي</tajweed>مِ <span class=end>١</span>',
            },
          ],
        })
      );
    }
  ),

  rest.get('https://api.quran.com/api/v4/chapters', (_req, res, ctx) => {
    return res(
      ctx.json({
        chapters: [
          {
            id: 1,
            revelation_place: 'makkah',
            revelation_order: 5,
            bismillah_pre: false,
            name_simple: 'Al-Fatihah',
            name_complex: 'Al-Fātiĥah',
            name_arabic: 'الفاتحة',
            verses_count: 7,
            pages: [1, 1],
            translated_name: { language_name: 'english', name: 'The Opener' },
          },
        ],
      })
    );
  }),

  rest.get(
    'https://api.quran.com/api/v4/resources/translations',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          translations: [
            {
              id: 131,
              name: 'Dr. Mustafa Khattab, the Clear Quran',
              author_name: 'Dr. Mustafa Khattab',
              slug: 'clearquran-with-tafsir',
              language_name: 'english',
              translated_name: {
                name: 'Dr. Mustafa Khattab',
                language_name: 'english',
              },
            },
          ],
        })
      );
    }
  ),

  rest.get('https://api.quran.com/api/v4/search', (_req, res, ctx) => {
    return res(ctx.json({}));
  }),

  rest.get(
    'https://api.quran.com/api/v4/resources/recitations',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          recitations: [
            {
              id: 1,
              reciter_name: 'AbdulBaset AbdulSamad',
              style: 'Mujawwad',
              translated_name: {
                name: 'AbdulBaset AbdulSamad',
                language_name: 'english',
              },
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/verses/code_v2',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            { id: 1, verse_key: '1:1', code_v2: ' ﱂ ﱃ ﱄ ﱅ', v2_page: 1 },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/chapter_recitations/:id/:chapter_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_file: {
            id: 43,
            chapter_id: 22,
            file_size: 19779712,
            format: 'mp3',
            total_files: 1,
            audio_url:
              'https://download.quranicaudio.com/quran/abdullaah_3awwaad_al-juhaynee/022.mp3',
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/recitations/:recitation_id/by_ayah/:ayah_key',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'AbdulBaset/Mujawwad/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'AbdulBaset/Mujawwad/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'AbdulBaset/Mujawwad/mp3/001003.mp3' },
          ],
          pagination: {
            per_page: 10,
            current_page: 1,
            next_page: 2,
            total_pages: 15,
            total_records: 148,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/verses/code_v1',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            { id: 1, verse_key: '1:1', code_v1: 'ﭑ ﭒ ﭓ ﭔ ﭕ', v1_page: 1 },
          ],
        })
      );
    }
  ),

  rest.get('https://api.quran.com/api/v4/verses/random', (_req, res, ctx) => {
    return res(
      ctx.json({
        verse: {
          id: 1,
          verse_number: 1,
          page_number: 1,
          verse_key: '1:1',
          juz_number: 1,
          hizb_number: 1,
          rub_number: 1,
          sajdah_type: null,
          sajdah_number: null,
          words: [
            {
              id: 1,
              position: 1,
              audio_url: 'wbw/001_001_001.mp3',
              char_type_name: 'word',
              line_number: 2,
              page_number: 1,
              code_v1: '&#xfb51;',
              translation: { text: 'In (the) name', language_name: 'english' },
              transliteration: { text: "bis'mi", language_name: 'english' },
            },
          ],
          translations: [
            {
              resource_id: 131,
              text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
            },
          ],
          tafsirs: [
            {
              id: 82641,
              language_name: 'english',
              name: 'Tafsir Ibn Kathir',
              text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
            },
          ],
        },
      })
    );
  }),

  rest.get(
    'https://api.quran.com/api/v4/recitations/:recitation_id/by_juz/:juz_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'AbdulBaset/Mujawwad/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'AbdulBaset/Mujawwad/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'AbdulBaset/Mujawwad/mp3/001003.mp3' },
          ],
          pagination: {
            per_page: 10,
            current_page: 1,
            next_page: 2,
            total_pages: 2,
            total_records: 20,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/translations/:translation_id',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          translations: [
            {
              resource_id: 131,
              text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
            },
          ],
          meta: {
            translation_name: 'Dr. Mustafa Khattab, the Clear Quran',
            author_name: 'Dr. Mustafa Khattab',
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/recitation_styles',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          recitation_styles: {
            mujawwad: 'Mujawwad is a melodic style of Holy Quran recitation',
            murattal:
              'Murattal is at a slower pace, used for study and practice',
            muallim: 'Muallim is teaching style recitation of Holy Quran',
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/verses/indopak',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_key: '1:1',
              text_indopak: 'بِسۡمِ اللهِ الرَّحۡم]ٰنِ الرَّحِيۡمِ',
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/recitations/:recitation_id/by_page/:page_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'AbdulBaset/Mujawwad/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'AbdulBaset/Mujawwad/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'AbdulBaset/Mujawwad/mp3/001003.mp3' },
          ],
          pagination: {
            per_page: 10,
            current_page: 1,
            next_page: 2,
            total_pages: 15,
            total_records: 148,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/verses/by_chapter/:chapter_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_number: 1,
              page_number: 1,
              verse_key: '1:1',
              juz_number: 1,
              hizb_number: 1,
              rub_number: 1,
              sajdah_type: null,
              sajdah_number: null,
              words: [
                {
                  id: 1,
                  position: 1,
                  audio_url: 'wbw/001_001_001.mp3',
                  char_type_name: 'word',
                  line_number: 2,
                  page_number: 1,
                  code_v1: '&#xfb51;',
                  translation: {
                    text: 'In (the) name',
                    language_name: 'english',
                  },
                  transliteration: { text: "bis'mi", language_name: 'english' },
                },
              ],
              translations: [
                {
                  resource_id: 131,
                  text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
                },
              ],
              tafsirs: [
                {
                  id: 82641,
                  language_name: 'english',
                  name: 'Tafsir Ibn Kathir',
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
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/chapters/:chapter_id/info',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          chapter_info: {
            id: 1,
            chapter_id: 1,
            language_name: 'english',
            short_text:
              'This Surah is named Al-Fatihah because of its subject-matter. Fatihah is that which opens a subject or a book or any other thing. In other words, Al-Fatihah is a sort of preface.',
            source:
              "Sayyid Abul Ala Maududi - Tafhim al-Qur'an - The Meaning of the Quran",
            text: '<h2>Name</h2>\r\n<p>This Surah is named Al-Fatihah because of its subject-matter. Fatihah is that which opens a subject or a book or any other thing. In other words, Al-Fatihah is a sort of preface.</p>\r\n<h2>Period of Revelation</h2>...',
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/chapter_infos',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          chapter_infos: [
            {
              id: 155,
              name: 'Hamza Roberto Piccardo',
              author_name: 'Hamza Roberto Piccardo',
              slug: 'hamza-roberto-piccardo-info',
              language_name: 'italian',
              translated_name: {
                name: 'Hamza Roberto Piccardo',
                language_name: 'english',
              },
            },
            {
              id: 63,
              name: 'Chapter Info',
              author_name: 'Sayyid Abul Ala Maududi',
              slug: null,
              language_name: 'malayalam',
              translated_name: {
                name: 'Chapter Info',
                language_name: 'english',
              },
            },
            {
              id: 62,
              name: 'Chapter Info',
              author_name: 'Sayyid Abul Ala Maududi',
              slug: null,
              language_name: 'tamil',
              translated_name: {
                name: 'Chapter Info',
                language_name: 'english',
              },
            },
            {
              id: 61,
              name: 'Chapter Info',
              author_name: 'Sayyid Abul Ala Maududi',
              slug: null,
              language_name: 'urdu',
              translated_name: {
                name: 'Chapter Info',
                language_name: 'english',
              },
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/verse_media',
    (_req, res, ctx) => {
      return res(ctx.json({}));
    }
  ),

  rest.get('https://api.quran.com/api/v4/juzs', (_req, res, ctx) => {
    return res(ctx.json({}));
  }),

  rest.get(
    'https://api.quran.com/api/v4/quran/verses/imlaei',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_key: '1:1',
              text_imlaei: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/translations/:translation_id/info',
    (_req, res, ctx) => {
      return res(ctx.json({ info: { id: 1, info: null } }));
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/verses/uthmani',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_key: '1:1',
              text_uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ',
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/tafsirs',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          tafsirs: [
            {
              id: 169,
              name: 'Tafsir Ibn Kathir',
              author_name: 'Hafiz Ibn Kathir',
              slug: 'en-tafisr-ibn-kathir',
              language_name: 'english',
              translated_name: {
                name: 'Tafsir Ibn Kathir',
                language_name: 'english',
              },
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/tafsirs/:tafsir_id',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          tafsirs: [
            {
              resource_id: 169,
              text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2><p>This Surah is called</p><p>-        Al-Fatihah, that is, the Opener of the Book, the Surah with which prayers are begun.',
            },
          ],
          meta: {
            tafsir_name: 'Tafsir Ibn Kathir',
            author_name: 'Hafiz Ibn Kathir',
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/recitations/:recitation_id/info',
    (_req, res, ctx) => {
      return res(ctx.json({ info: { id: 1, info: null } }));
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/recitations/:recitation_id',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'Alafasy/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'Alafasy/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'Alafasy/mp3/001003.mp3' },
            { verse_key: '1:4', url: 'Alafasy/mp3/001004.mp3' },
            { verse_key: '1:5', url: 'Alafasy/mp3/001005.mp3' },
            { verse_key: '1:6', url: 'Alafasy/mp3/001006.mp3' },
            { verse_key: '1:7', url: 'Alafasy/mp3/001007.mp3' },
          ],
          meta: {
            reciter_name: 'Mishari Rashid al-`Afasy',
            recitation_style: null,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/chapter_reciters',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          reciters: [
            {
              id: 3,
              name: 'Abu Bakr al-Shatri',
              arabic_name: 'أبو بكر الشاطرى',
              relative_path: 'abu_bakr_ash-shaatree/',
              format: 'mp3',
              files_size: 1258422528,
            },
            {
              id: 4,
              name: 'Sa`ud ash-Shuraym',
              arabic_name: 'سعود الشريم',
              relative_path: 'sa3ood_al-shuraym/',
              format: 'mp3',
              files_size: 1258422528,
            },
            {
              id: 5,
              name: 'Mishari Rashid al-`Afasy',
              arabic_name: 'مشاري راشد العفاسي',
              relative_path: 'mishaari_raashid_al_3afaasee/',
              format: 'mp3',
              files_size: 1258422528,
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/languages',
    (_req, res, ctx) => {
      return res(ctx.json([{ id: -71611860, iso_code: 'amet' }]));
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/verses/by_hizb/:hizb_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_number: 1,
              page_number: 1,
              verse_key: '1:1',
              juz_number: 1,
              hizb_number: 1,
              rub_number: 1,
              sajdah_type: null,
              sajdah_number: null,
              words: [
                {
                  id: 1,
                  position: 1,
                  audio_url: 'wbw/001_001_001.mp3',
                  char_type_name: 'word',
                  line_number: 2,
                  page_number: 1,
                  code_v1: '&#xfb51;',
                  translation: {
                    text: 'In (the) name',
                    language_name: 'english',
                  },
                  transliteration: { text: "bis'mi", language_name: 'english' },
                },
              ],
              translations: [
                {
                  resource_id: 131,
                  text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
                },
              ],
              tafsirs: [
                {
                  id: 82641,
                  language_name: 'english',
                  name: 'Tafsir Ibn Kathir',
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
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/resources/tafsirs/:tafsir_id/info',
    (_req, res, ctx) => {
      return res(ctx.json({}));
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/recitations/:recitation_id/by_rub/:rub_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'AbdulBaset/Mujawwad/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'AbdulBaset/Mujawwad/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'AbdulBaset/Mujawwad/mp3/001003.mp3' },
          ],
          pagination: {
            per_page: 10,
            current_page: 1,
            next_page: 2,
            total_pages: 15,
            total_records: 148,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/quran/verses/uthmani_simple',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_key: '1:1',
              text_uthmani_simple: 'بسم الله الرحمن الرحيم',
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/verses/by_juz/:juz_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_number: 1,
              page_number: 1,
              verse_key: '1:1',
              juz_number: 1,
              hizb_number: 1,
              rub_number: 1,
              sajdah_type: null,
              sajdah_number: null,
              words: [
                {
                  id: 1,
                  position: 1,
                  audio_url: 'wbw/001_001_001.mp3',
                  char_type_name: 'word',
                  line_number: 2,
                  page_number: 1,
                  code_v1: '&#xfb51;',
                  translation: {
                    text: 'In (the) name',
                    language_name: 'english',
                  },
                  transliteration: { text: "bis'mi", language_name: 'english' },
                },
              ],
              translations: [
                {
                  resource_id: 131,
                  text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
                },
              ],
              tafsirs: [
                {
                  id: 82641,
                  language_name: 'english',
                  name: 'Tafsir Ibn Kathir',
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
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/chapter_recitations/:id',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            {
              id: 43,
              chapter_id: 22,
              file_size: 19779712,
              format: 'mp3',
              total_files: 1,
              audio_url:
                'https://download.quranicaudio.com/quran/abdullaah_3awwaad_al-juhaynee//022.mp3',
            },
            {
              id: 87,
              chapter_id: 44,
              file_size: 6453376,
              format: 'mp3',
              total_files: 1,
              audio_url:
                'https://download.quranicaudio.com/quran/abdullaah_3awwaad_al-juhaynee//044.mp3',
            },
          ],
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/recitations/:recitation_id/by_chapter/:chapter_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'AbdulBaset/Mujawwad/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'AbdulBaset/Mujawwad/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'AbdulBaset/Mujawwad/mp3/001003.mp3' },
          ],
          pagination: {
            per_page: 10,
            current_page: 1,
            next_page: 2,
            total_pages: 2,
            total_records: 20,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/recitations/:recitation_id/by_hizb/:hizb_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          audio_files: [
            { verse_key: '1:1', url: 'AbdulBaset/Mujawwad/mp3/001001.mp3' },
            { verse_key: '1:2', url: 'AbdulBaset/Mujawwad/mp3/001002.mp3' },
            { verse_key: '1:3', url: 'AbdulBaset/Mujawwad/mp3/001003.mp3' },
          ],
          pagination: {
            per_page: 10,
            current_page: 1,
            next_page: 2,
            total_pages: 15,
            total_records: 148,
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/verses/by_page/:page_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_number: 1,
              page_number: 1,
              verse_key: '1:1',
              juz_number: 1,
              hizb_number: 1,
              rub_number: 1,
              sajdah_type: null,
              sajdah_number: null,
              words: [
                {
                  id: 1,
                  position: 1,
                  audio_url: 'wbw/001_001_001.mp3',
                  char_type_name: 'word',
                  line_number: 2,
                  page_number: 1,
                  code_v1: '&#xfb51;',
                  translation: {
                    text: 'In (the) name',
                    language_name: 'english',
                  },
                  transliteration: { text: "bis'mi", language_name: 'english' },
                },
              ],
              translations: [
                {
                  resource_id: 131,
                  text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
                },
              ],
              tafsirs: [
                {
                  id: 82641,
                  language_name: 'english',
                  name: 'Tafsir Ibn Kathir',
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
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/verses/by_key/:verse_key',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verse: {
            id: 1,
            verse_number: 1,
            page_number: 1,
            verse_key: '1:1',
            juz_number: 1,
            hizb_number: 1,
            rub_number: 1,
            sajdah_type: null,
            sajdah_number: null,
            words: [
              {
                id: 1,
                position: 1,
                audio_url: 'wbw/001_001_001.mp3',
                char_type_name: 'word',
                line_number: 2,
                page_number: 1,
                code_v1: '&#xfb51;',
                translation: {
                  text: 'In (the) name',
                  language_name: 'english',
                },
                transliteration: { text: "bis'mi", language_name: 'english' },
              },
            ],
            translations: [
              {
                resource_id: 131,
                text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
              },
            ],
            tafsirs: [
              {
                id: 82641,
                language_name: 'english',
                name: 'Tafsir Ibn Kathir',
                text: '<h2 class="title">Which was revealed in Makkah</h2><h2 class="title">The Meaning of Al-Fatihah and its Various Names</h2>',
              },
            ],
          },
        })
      );
    }
  ),

  rest.get(
    'https://api.quran.com/api/v4/verses/by_rub/:rub_number',
    (_req, res, ctx) => {
      return res(
        ctx.json({
          verses: [
            {
              id: 1,
              verse_number: 1,
              page_number: 1,
              verse_key: '1:1',
              juz_number: 1,
              hizb_number: 1,
              rub_number: 1,
              sajdah_type: null,
              sajdah_number: null,
              words: [
                {
                  id: 1,
                  position: 1,
                  audio_url: 'wbw/001_001_001.mp3',
                  char_type_name: 'word',
                  line_number: 2,
                  page_number: 1,
                  code_v1: '&#xfb51;',
                  translation: {
                    text: 'In (the) name',
                    language_name: 'english',
                  },
                  transliteration: { text: "bis'mi", language_name: 'english' },
                },
              ],
              translations: [
                {
                  resource_id: 131,
                  text: 'In the Name of Allah—the Most Compassionate, Most Merciful.',
                },
              ],
              tafsirs: [
                {
                  id: 82641,
                  language_name: 'english',
                  name: 'Tafsir Ibn Kathir',
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
        })
      );
    }
  ),

  rest.get('https://api.quran.com/api/v4/chapters/:id', (_req, res, ctx) => {
    return res(
      ctx.json({
        chapter: {
          id: 1,
          revelation_place: 'makkah',
          revelation_order: 5,
          bismillah_pre: false,
          name_simple: 'Al-Fatihah',
          name_complex: 'Al-Fātiĥah',
          name_arabic: 'الفاتحة',
          verses_count: 7,
          pages: [1, 1],
          translated_name: { language_name: 'english', name: 'The Opener' },
        },
      })
    );
  }),
];
