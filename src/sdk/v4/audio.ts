import {
  AudioData,
  ChapterId,
  HizbNumber,
  JuzNumber,
  Language,
  PageNumber,
  Pagination,
  RubNumber,
  VerseKey,
} from '@/types';
import Utils from '../utils';
import { fetcher } from './_fetcher';

type GetRecitationsOptions = Partial<{
  language: Language;
}>;

const defaultOptions: GetRecitationsOptions = {
  language: Language.ARABIC,
};

const getAudioOptions = (options: GetRecitationsOptions = {}) => {
  const final: any = { ...defaultOptions, ...options };

  return final;
};

/**
 * Get all chapter recitations for specific reciter
 * @description https://quran.api-docs.io/v4/audio-recitations/list-of-all-surah-audio-files-for-specific-reciter
 * @param {string} reciterId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findAllChapterRecitations('2')
 */
const findAllChapterRecitations = async (
  reciterId: string,
  options?: GetRecitationsOptions
) => {
  const params = getAudioOptions(options);
  const { audioFiles } = await fetcher<{ audioFiles: AudioData[] }>(
    `/chapter_recitations/${reciterId}`,
    params
  );
  return audioFiles;
};

/**
 * Get chapter recitation for specific reciter and a specific chapter
 * @description https://quran.api-docs.io/v4/audio-recitations/get-single-surah-audio-for-specific-reciter
 * @param {ChapterId} chapterId
 * @param {string} reciterId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findChapterRecitationById('1', '2') // first chapter recitation for reciter 2
 */
const findChapterRecitationById = async (
  chapterId: ChapterId,
  reciterId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidChapterId(chapterId)) throw new Error('Invalid chapter id');

  const params = getAudioOptions(options);
  const { audioFile } = await fetcher<{ audioFile: AudioData }>(
    `/chapter_recitations/${reciterId}/${chapterId}`,
    params
  );

  return audioFile;
};

/**
 * Get all verse audio files for a specific reciter and a specific chapter
 * @description https://quran.api-docs.io/v4/audio-recitations/get-ayah-recitations-for-specific-surah
 * @param {ChapterId} chapterId
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByChapter('1', '2')
 */
const findVerseRecitationsByChapter = async (
  chapterId: ChapterId,
  recitationId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidChapterId(chapterId)) throw new Error('Invalid chapter id');

  const params = getAudioOptions(options);
  const data = await fetcher<{
    audioFiles: AudioData[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_chapter/${chapterId}`, params);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific juz
 * @description https://quran.api-docs.io/v4/audio-recitations/get-ayah-recitations-for-specific-juz
 * @param {JuzNumber} juz
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByJuz('1', '2')
 */
const findVerseRecitationsByJuz = async (
  juz: JuzNumber,
  recitationId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidJuz(juz)) throw new Error('Invalid juz');

  const params = getAudioOptions(options);
  const data = await fetcher<{
    audioFiles: AudioData[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_juz/${juz}`, params);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific mushaf page
 * @description https://quran.api-docs.io/v4/audio-recitations/get-ayah-recitations-for-specific-madani-mushaf-page
 * @param {PageNumber} page
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByPage('1', '2')
 */
const findVerseRecitationsByPage = async (
  page: PageNumber,
  recitationId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidQuranPage(page)) throw new Error('Invalid page');

  const params = getAudioOptions(options);
  const data = await fetcher<{
    audioFiles: AudioData[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_page/${page}`, params);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific rub
 * @description https://quran.api-docs.io/v4/audio-recitations/get-ayah-recitations-for-specific-rub
 * @param {RubNumber} rub
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByRub('1', '2')
 */
const findVerseRecitationsByRub = async (
  rub: RubNumber,
  recitationId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidRub(rub)) throw new Error('Invalid rub');

  const params = getAudioOptions(options);
  const data = await fetcher<{
    audioFiles: AudioData[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_rub/${rub}`, params);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific hizb
 * @description https://quran.api-docs.io/v4/audio-recitations/get-ayah-recitations-for-specific-hizb
 * @param {HizbNumber} hizb
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByHizb('1', '2')
 */
const findVerseRecitationsByHizb = async (
  hizb: HizbNumber,
  recitationId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidHizb(hizb)) throw new Error('Invalid hizb');

  const params = getAudioOptions(options);
  const data = await fetcher<{
    audioFiles: AudioData[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_hizb/${hizb}`, params);

  return data;
};

/**
 * Get all verse audio files for a specific reciter and a specific hizb
 * @description https://quran.api-docs.io/v4/audio-recitations/get-ayah-recitations-for-specific-ayah
 * @param {VerseKey} key
 * @param {string} recitationId
 * @param {GetRecitationsOptions} options
 * @example
 * quran.v4.audio.findVerseRecitationsByKey('1:1', '2')
 */
const findVerseRecitationsByKey = async (
  key: VerseKey,
  recitationId: string,
  options?: GetRecitationsOptions
) => {
  if (!Utils.isValidVerseKey(key)) throw new Error('Invalid verse key');

  const params = getAudioOptions(options);
  const data = await fetcher<{
    audioFiles: AudioData[];
    pagination: Pagination;
  }>(`/recitations/${recitationId}/by_ayah/${key}`, params);

  return data;
};

const audio = {
  findAllChapterRecitations,
  findChapterRecitationById,
  findVerseRecitationsByChapter,
  findVerseRecitationsByJuz,
  findVerseRecitationsByPage,
  findVerseRecitationsByRub,
  findVerseRecitationsByHizb,
  findVerseRecitationsByKey,
};

export default audio;
