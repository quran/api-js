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
