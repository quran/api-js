import { createApiTest } from './utils';

createApiTest('verses', {
  findByChapter: {
    expect: {
      array: true,
    },
    params: ['1'],
    rejectParams: ['0' as any],
  },
  findByJuz: {
    expect: {
      array: true,
    },
    params: ['1'],
    rejectParams: ['0' as any],
  },
  findByKey: {
    params: ['1:1'],
    rejectParams: ['0:0' as any],
  },
  findByPage: {
    expect: {
      array: true,
    },
    params: ['1'],
    rejectParams: ['0' as any],
  },
  findRandom: {},
  findByHizb: {
    expect: {
      array: true,
    },
    params: ['1'],
    rejectParams: ['0' as any],
  },
  findByRub: {
    params: ['1'],
    rejectParams: ['0' as any],
  },
});
