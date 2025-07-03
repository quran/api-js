/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dotenv from 'dotenv';
dotenv.config();

import { configure, quran } from '../src';

(async () => {
  try {
    // 1. Configure the SDK
    configure({
      clientId: process.env.QF_CLIENT_ID!,
      clientSecret: process.env.QF_CLIENT_SECRET!,
    });

    // 2. Chapters
    const chapters = await quran.qf.chapters.findAll();
    console.log(`✅ Chapters: ${chapters.length}`);

    const chapter = await quran.qf.chapters.findById(1);
    console.log(`✅ Chapter 1 name: ${chapter.nameArabic}`);

    // 3. Verses
    const verses = await quran.qf.verses.findByChapter(1, {
      page: 1,
      perPage: 5,
    });
    console.log(`✅ Verses from chapter 1: ${verses.length}`);

    const verseById = await quran.qf.verses.findByKey('1:1');
    console.log(`✅ Verse 1 text: ${verseById.text_uthmani}}`);

    const juzVerses = await quran.qf.verses.findByJuz(1, {
      perPage: 5,
    });
    console.log(`✅ Verses from juz 1: ${juzVerses.length}`);

    // 4. Juzs
    const juzs = await quran.qf.juzs.findAll();
    console.log(`✅ Juzs: ${juzs.length}`);

    const juz = await quran.qf.juzs.findAll();
    console.log(`✅ Juz 1: ${juz.length} verse mappings`);

    // 5. Resources
    const resources = await quran.qf.resources.findAllChapterInfos();
    console.log(`✅ Resources: ${resources.length}`);

    const translations = await quran.qf.resources.findAllTranslations();
    console.log(`✅ Translations: ${translations.length}`);

    const tafsirs = await quran.qf.resources.findAllTafsirs();
    console.log(`✅ Tafsirs: ${tafsirs.length}`);

    const reciters = await quran.qf.resources.findAllRecitations();
    console.log(`✅ Reciters: ${reciters.length}`);

    // 6. Audio (chapter-reciter combo)
    const audioFiles = await quran.qf.audio.findAllChapterRecitations('1');
    console.log(`✅ Audio files for Chapter 1: ${audioFiles.length}`);

    // 7. Search
    
    const search = await quran.qf.search.search('نور');

    console.log(`✅ Search for "نور": ${search.results?.length} matches`);

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY 🎉');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
  }
})();
