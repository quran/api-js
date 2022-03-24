import { ChapterId, Language, Verse, VerseField, VerseKey } from '@/types';
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

const Verses = {
  async findByKey(key: VerseKey, options?: GetVerseOptions) {
    if (!Utils.isValidVerseKey(key)) throw new Error('Invalid verse key');
    const params = getVerseOptions(options);
    const url = `/verses/by_key/${key}`;
    const { verse } = await fetcher<{ verse: Verse }>(url, params);

    return verse;
  },
  async findByChapter(id: ChapterId, options?: GetVerseOptions) {
    const params = getVerseOptions(options);
    const url = `/verses/by_chapter/${id}`;
    const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

    return verses;
  },
  async findByPage(page: number, options?: GetVerseOptions) {
    const params = getVerseOptions(options);
    const url = `/verses/by_page/${page}`;
    const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

    return verses;
  },
  async findByJuz(juz: number, options?: GetVerseOptions) {
    const params = getVerseOptions(options);
    const url = `/verses/by_juz/${juz}`;
    const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

    return verses;
  },
  async findByHizb(hizb: number, options?: GetVerseOptions) {
    const params = getVerseOptions(options);
    const url = `/verses/by_hizb/${hizb}`;
    const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

    return verses;
  },
  async findByRub(rub: number, options?: GetVerseOptions) {
    const params = getVerseOptions(options);
    const url = `/verses/by_rub/${rub}`;
    const { verses } = await fetcher<{ verses: Verse[] }>(url, params);

    return verses;
  },
  async findRandom(options?: GetVerseOptions) {
    const params = getVerseOptions(options);
    const { verse } = await fetcher<{ verse: Verse }>('/verses/random', params);

    return verse;
  },
};

export default Verses;
