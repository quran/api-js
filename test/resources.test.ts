import { createApiTest } from './utils';

createApiTest('resources', {
  findAllChapterInfos: {},
  findAllChapterReciters: {},
  findAllLanguages: {},
  findAllRecitationStyles: {
    // we did that because method name contains `All`, but the response isn't an array
    expect: {
      array: false,
    },
  },
  findAllRecitations: {},
  findAllTafsirs: {},
  findAllTranslations: {},
  findVerseMedia: {},
  findRecitationInfo: {
    params: ['1'],
  },
  findTranslationInfo: {
    params: ['1'],
  },
  findTafsirInfo: {
    params: ['169'],
  },
});
