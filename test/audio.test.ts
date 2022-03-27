import { createApiTest } from './utils';

const recitation = '2'; // abdulbaset abdulsamad

createApiTest('audio', {
  findAllChapterRecitations: {},
  findChapterRecitationById: {
    params: ['1', recitation], // chapterId, reciterId
    rejectParams: ['0' as any, '0'],
  },
  findVerseRecitationsByChapter: {
    params: ['1', recitation],
    rejectParams: ['0' as any, '0'],
  },
  findVerseRecitationsByHizb: {
    params: ['1', recitation],
    rejectParams: ['0' as any, '0'],
  },
  findVerseRecitationsByJuz: {
    params: ['1', recitation],
    rejectParams: ['0' as any, '0'],
  },
  findVerseRecitationsByKey: {
    params: ['1:1', recitation],
    rejectParams: ['0' as any, '0'],
  },
  findVerseRecitationsByPage: {
    params: ['1', recitation],
    rejectParams: ['0' as any, '0'],
  },
  findVerseRecitationsByRub: {
    params: ['1', recitation],
    rejectParams: ['0' as any, '0'],
  },
});
