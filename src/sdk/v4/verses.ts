import {
  ChapterId,
  // HizbNumber,
  JuzNumber,
  Language,
  PageNumber,
  // RubNumber,
  Verse,
  VerseField,
  VerseKey,
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
  wordFields: string[];
  translationFields: string[];
  fields: Record<VerseField, boolean>;
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
  if (initial.wordFields) result.wordFields = initial.wordFields.join(',');
  if (initial.translationFields)
    result.translationFields = initial.translationFields.join(',');

  if (initial.fields) {
    const fields: string[] = [];
    for (const [key, value] of Object.entries(initial.fields)) {
      if (value) fields.push(decamelize(key));
    }
    result.fields = fields.join(',');
  }

  if (initial.reciter) result.audio = initial.reciter;

  return result;
};

/**
 * Get a specific ayah with key. Key is combination of surah number and ayah number.
 * @description /verses/by_key/{key}
 * @param {string} key - surah number and ayah number separated by a colon.
 * @param {GetVerseOptions} options
 * @example
 * // first ayah of the first surah
 * quran.v4.verses.findByKey('1:1')
 *
 * // 5th ayah of the 101th surah
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
 * @description /verses/by_chapter/{chapter_id}
 * @param {string} id - chapter id (surah number)
 * @param {GetVerseOptions} options
 * @example
 * // all ayahs of the first surah
 * quran.v4.verses.findByChapter('1')
 *
 * // all ayahs of the 101th surah
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
 * @description /verses/by_page/{page_number}
 * @param {string} page - Quran page number
 * @param {GetVerseOptions} options
 * @example
 * // all ayahs of the first page
 * quran.v4.verses.findByPage('1')
 *
 * // all ayahs of the 101th page
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
 * @description /verses/by_juz/{juz_number}
 * @param {string} id - juz number
 * @param {GetVerseOptions} options
 * @example
 * // all ayahs of the first juz
 * quran.v4.verses.findByJuz('1')
 *
 * // all ayahs of the 29th juz
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
 * @description /verses/by_hizb/{hizb_number}
 * @param {string} hizb - hizb number
 * @param {GetVerseOptions} options
 * @example
 * // all ayahs of the first hizb
 * quran.v4.verses.findByHizb('1')
 *
 * // all ayahs of the 29th hizb
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
 * @description /verses/by_rub/{rub_number}
 * @param {string} rub - rub number
 * @param {GetVerseOptions} options
 * @example
 * // all ayahs of the first rub
 * quran.v4.verses.findByRub('1')
 *
 * // all ayahs of the 29th rub
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
 * @description /verses/random
 * @param {GetVerseOptions} options
 * @example
 * quran.v4.verses.findRandom()
 */
const findRandom = async (options?: GetVerseOptions) => {
  const params = getVerseOptions(options);
  const { verse } = await fetcher<{ verse: Verse }>('/verses/random', params);

  return verse;
};

export default {
  findByKey,
  findByChapter,
  findByPage,
  findByJuz,
  // findByHizb,
  // findByRub,
  findRandom,
};
