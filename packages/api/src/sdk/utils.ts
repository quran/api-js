import {
  ChapterId,
  HizbNumber,
  JuzNumber,
  PageNumber,
  RubNumber,
  VerseKey,
} from '../types';

// this maps chapterNumber to verseCount
export const versesMapping = {
  '1': 7,
  '2': 286,
  '3': 200,
  '4': 176,
  '5': 120,
  '6': 165,
  '7': 206,
  '8': 75,
  '9': 129,
  '10': 109,
  '11': 123,
  '12': 111,
  '13': 43,
  '14': 52,
  '15': 99,
  '16': 128,
  '17': 111,
  '18': 110,
  '19': 98,
  '20': 135,
  '21': 112,
  '22': 78,
  '23': 118,
  '24': 64,
  '25': 77,
  '26': 227,
  '27': 93,
  '28': 88,
  '29': 69,
  '30': 60,
  '31': 34,
  '32': 30,
  '33': 73,
  '34': 54,
  '35': 45,
  '36': 83,
  '37': 182,
  '38': 88,
  '39': 75,
  '40': 85,
  '41': 54,
  '42': 53,
  '43': 89,
  '44': 59,
  '45': 37,
  '46': 35,
  '47': 38,
  '48': 29,
  '49': 18,
  '50': 45,
  '51': 60,
  '52': 49,
  '53': 62,
  '54': 55,
  '55': 78,
  '56': 96,
  '57': 29,
  '58': 22,
  '59': 24,
  '60': 13,
  '61': 14,
  '62': 11,
  '63': 11,
  '64': 18,
  '65': 12,
  '66': 12,
  '67': 30,
  '68': 52,
  '69': 52,
  '70': 44,
  '71': 28,
  '72': 28,
  '73': 20,
  '74': 56,
  '75': 40,
  '76': 31,
  '77': 50,
  '78': 40,
  '79': 46,
  '80': 42,
  '81': 29,
  '82': 19,
  '83': 36,
  '84': 25,
  '85': 22,
  '86': 17,
  '87': 19,
  '88': 26,
  '89': 30,
  '90': 20,
  '91': 15,
  '92': 21,
  '93': 11,
  '94': 8,
  '95': 8,
  '96': 19,
  '97': 5,
  '98': 8,
  '99': 8,
  '100': 11,
  '101': 11,
  '102': 8,
  '103': 3,
  '104': 9,
  '105': 5,
  '106': 4,
  '107': 7,
  '108': 3,
  '109': 6,
  '110': 3,
  '111': 5,
  '112': 4,
  '113': 5,
  '114': 6,
};

/**
 * Validates chapter id
 * @param id chapter id
 * @example 
 isValidChapterId('1') // true
 isValidChapterId('114') // true
 isValidChapterId('0') // false
 isValidChapterId('-1') // false
 isValidChapterId('200') // false
 */
const isValidChapterId = (id: string | number): id is ChapterId => {
  const parsedId = typeof id === 'number' ? id : Number(id);
  if (!parsedId || parsedId <= 0 || parsedId > 114) return false;
  return true;
};

/**
 * Validates juz number
 * @param juz juz number
 * @example 
 isValidJuz('1') // true
 isValidJuz('30') // true
 isValidJuz('0') // false
 isValidJuz('-1') // false
 isValidJuz('200') // false
 */
const isValidJuz = (juz: string | number): juz is JuzNumber => {
  const parsedJuz = typeof juz === 'number' ? juz : Number(juz);
  if (!parsedJuz || parsedJuz <= 0 || parsedJuz > 30) return false;
  return true;
};

/**
 * Validates rub number
 * @param rub rub number
 * @example 
 isValidRub('1') // true
 isValidRub('240') // true
 isValidRub('0') // false
 isValidRub('-1') // false
 isValidRub('300') // false
 */
const isValidRub = (rub: string | number): rub is RubNumber => {
  const parsedRub = typeof rub === 'number' ? rub : Number(rub);
  if (!parsedRub || parsedRub <= 0 || parsedRub > 240) return false;
  return true;
};

/**
 * Validates hizb number
 * @param hizb hizb number
 * @example 
 isValidHizb('1') // true
 isValidHizb('60') // true
 isValidHizb('0') // false
 isValidHizb('-1') // false
 isValidHizb('200') // false
 */
const isValidHizb = (hizb: string | number): hizb is HizbNumber => {
  const parsedHizb = typeof hizb === 'number' ? hizb : Number(hizb);
  if (!parsedHizb || parsedHizb <= 0 || parsedHizb > 60) return false;
  return true;
};

/**
 * Validates mushaf page number
 * @param page mushaf page number
 * @example 
 isValidQuranPage('1') // true
 isValidQuranPage('604') // true
 isValidQuranPage('0') // false
 isValidQuranPage('-1') // false
 isValidQuranPage('1000') // false
 */
const isValidQuranPage = (page: string | number): page is PageNumber => {
  const parsedPage = typeof page === 'number' ? page : Number(page);
  if (!parsedPage || parsedPage <= 0 || parsedPage > 604) return false;
  return true;
};

/**
 * Validates verse key
 * @param key colon separated verse key (chapter:verse)
 * @example 
 isValidVerseKey('1:1') // true
 isValidVerseKey('30:1') // true
 isValidVerseKey('0') // false
 isValidVerseKey('1:-') // false
 isValidVerseKey('1_1') // false
 */
const isValidVerseKey = (key: string): key is VerseKey => {
  const [chapterId, verseId] = key.trim().split(':');
  if (!chapterId || !verseId || !isValidChapterId(chapterId)) return false;

  const parsedVerse = Number(verseId);
  const verseCount = (versesMapping as Record<string, number>)[chapterId];
  if (!parsedVerse || parsedVerse <= 0 || parsedVerse > verseCount)
    return false;

  return true;
};

const utils = {
  isValidChapterId,
  isValidJuz,
  isValidRub,
  isValidHizb,
  isValidQuranPage,
  isValidVerseKey,
};

export default utils;
