import {
  ChapterId,
  // HizbNumber,
  JuzNumber,
  Language,
  PageNumber,
  TranslationField,
  // RubNumber,
  Verse,
  VerseField,
  VerseKey,
  WordField,
} from '@/types';
import { decamelize } from 'humps';
import Utils from '../utils';
import { fetcher } from './_fetcher';

type GetVerseOptions = Partial<{
  language: Language;
  reciter: string | number;
  words: boolean;
  translations: string[] | number[];
  tafsirs: string[] | number[];
  wordFields: Partial<Record<WordField, boolean>>;
  translationFields: Partial<Record<TranslationField, boolean>>;
  fields: Partial<Record<VerseField, boolean>>;
  page: number;
  perPage: number;
}>;

const defaultOptions: GetVerseOptions = {
  language: Language.ARABIC,
  perPage: 50,
};

const getVerseOptions = (options: GetVerseOptions = {}) => {
  const initial = { ...defaultOptions, ...options };
  const result: any = { language: initial.language, perPage: initial.perPage };

  if (initial.page) result.page = initial.page;
  if (initial.words !== undefined) result.words = initial.words;
  if (initial.translations)
    result.translations = initial.translations.join(',');
  if (initial.tafsirs) result.tafsirs = initial.tafsirs.join(',');

  if (initial.fields) {
    const fields: string[] = [];
    for (const [key, value] of Object.entries(initial.fields)) {
      if (value) fields.push(decamelize(key));
    }
    result.fields = fields.join(',');
  }

  if (initial.wordFields) {
    const wordFields: string[] = [];
    for (const [key, value] of Object.entries(initial.wordFields)) {
      if (value) wordFields.push(decamelize(key));
    }
    result.wordFields = wordFields.join(',');
  }

  if (initial.translationFields) {
    const translationFields: string[] = [];
    for (const [key, value] of Object.entries(initial.translationFields)) {
      if (value) translationFields.push(decamelize(key));
    }
    result.translationFields = translationFields.join(',');
  }

  if (initial.reciter) result.audio = initial.reciter;

  return result;
};

/**
 * Get a specific ayah with key. Key is combination of surah number and ayah number.
 * @description https://quran.api-docs.io/v4/verses/by-specific-verse-by-key
 * @param {VerseKey} key - surah number and ayah number separated by a colon.
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findByKey('1:1')
 * quran.v4.verses.findByKey('101:5')
 */
const findByKey = async (key: VerseKey, options?: GetVerseOptions) => {
  if (!Utils.isValidVerseKey(key)) throw new Error('Invalid verse key');
  const params = getVerseOptions(options);
  const url = `/verses/by_key/${key}`;
  const { verse } = await fetcher<{ verse: Verse }>(url, params);

  return verse;
};

/**
 * Get all ayahs for a specific chapter (surah).
 * @description https://quran.api-docs.io/v4/verses/by_chapter
 * @param {ChapterId} id - chapter id (surah number)
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findByChapter('1')
 * quran.v4.verses.findByChapter('101')
 */
const findByChapter = async (id: ChapterId, options?: GetVerseOptions) => {
  if (!Utils.isValidChapterId(id)) throw new Error('Invalid chapter id');
  const params = getVerseOptions(options);
  const url = `/verses/by_chapter/${id}`;
  const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

  return verses;
};

/**
 * Get all ayahs for a specific page in the Quran.
 * @description https://quran.api-docs.io/v4/verses/by-page
 * @param {PageNumber} page - Quran page number
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findByPage('1')
 * quran.v4.verses.findByPage('101')
 */
const findByPage = async (page: PageNumber, options?: GetVerseOptions) => {
  if (!Utils.isValidQuranPage(page)) throw new Error('Invalid page');

  const params = getVerseOptions(options);
  const url = `/verses/by_page/${page}`;
  const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

  return verses;
};

/**
 * Get all ayahs for a Juz.
 * @description https://quran.api-docs.io/v4/verses/by-juz
 * @param {JuzNumber} id - juz number
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findByJuz('1')
 * quran.v4.verses.findByJuz('29')
 */
const findByJuz = async (juz: JuzNumber, options?: GetVerseOptions) => {
  if (!Utils.isValidJuz(juz)) throw new Error('Invalid juz');

  const params = getVerseOptions(options);
  const url = `/verses/by_juz/${juz}`;
  const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

  return verses;
};

// TODO: uncomment when API is fixed
/**
 * Get all ayahs for a Hizb.
 * @description https://quran.api-docs.io/v4/verses/by-hizb-number
 * @param {HizbNumber} hizb - hizb number
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findByHizb('1')
 * quran.v4.verses.findByHizb('29')
 */
// const findByHizb = async (hizb: HizbNumber, options?: GetVerseOptions) => {
//   if (!Utils.isValidHizb(hizb)) throw new Error('Invalid hizb');

//   const params = getVerseOptions(options);
//   const url = `/verses/by_hizb/${hizb}`;
//   const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

//   return verses;
// };

// TODO: uncomment when API is fixed
/**
 * Get all ayahs for a Rub.
 * @description https://quran.api-docs.io/v4/verses/by-rub-number
 * @param {RubNumber} rub - rub number
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findByRub('1')
 * quran.v4.verses.findByRub('29')
 */
// const findByRub = async (rub: RubNumber, options?: GetVerseOptions) => {
//   if (!Utils.isValidRub(rub)) throw new Error('Invalid rub');

//   const params = getVerseOptions(options);
//   const url = `/verses/by_rub/${rub}`;
//   const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

//   return verses;
// };

/**
 * Get a random ayah.
 * @description https://quran.api-docs.io/v4/verses/random
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findRandom()
 */
const findRandom = async (options?: GetVerseOptions) => {
  const params = getVerseOptions(options);
  const { verse } = await fetcher<{ verse: Verse }>('/verses/random', params);

  return verse;
};

const verses = {
  findByKey,
  findByChapter,
  findByPage,
  findByJuz,
  // findByHizb,
  // findByRub,
  findRandom,
};

export default verses;
