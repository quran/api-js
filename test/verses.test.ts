import { expect, it, vi } from 'vitest';
import { createApiTest } from './utils';
import * as internalFetcher from '../src/sdk/v4/_fetcher';

createApiTest('verses', {
  findByChapter: {
    expect: {
      array: true,
    },
    params: ['1'],
    rejectParams: ['0' as any],
    customCases: (method) => {
      it('should return indopak_nastaleeq text', async () => {
        const fetcherSpy = vi.spyOn(internalFetcher, 'fetcher');

        const response = await method(1, {
          fields: { textIndopakNastaleeq: true },
        });

        const expectedIndopakNastaleeqText =
          'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ ۟';

        expect(fetcherSpy).toHaveBeenCalledWith(
          '/verses/by_chapter/1',
          {
            language: 'ar',
            perPage: 50,
            words: false,
            fields: 'text_indopak_nastaleeq',
          },
          undefined
        );
        expect(response[0].textIndopakNastaleeq).toBe(
          expectedIndopakNastaleeqText
        );
      });
    },
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
