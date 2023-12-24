import fc from 'fast-check';
import { fetcher } from '../src/sdk/v4/_fetcher';
import audio from '../src/sdk/v4/audio';
import { describe, it, expect, vi } from 'vitest';
import { VerseKey } from '../src';

// Use Vitest's vi.fn() to create a mock function
vi.mock('../src/sdk/v4/_fetcher', () => {
  return {
    fetcher: vi.fn(() => Promise.resolve({ audioFiles: [{ id: '1', reciterId: "someId" }] })),
    mergeApiOptions: vi.fn((options, defaults) => ({ ...defaults, ...options })),
  };
});

describe('Audio API - findAllChapterRecitations', () => {
  it('should handle various reciter IDs', async () => {
    fc.assert(
      fc.asyncProperty(fc.string(), async (reciterId) => {
        // Prepare mock response
        const mockResponse = { audioFiles: [{ id: '1', reciterId }] };
        fetcher.mockResolvedValue(mockResponse);

        // Call the function with the generated reciterId
        const result = await audio.findAllChapterRecitations(reciterId);

        // Assertions
        expect(fetcher).toHaveBeenCalledWith(`/chapter_recitations/${reciterId}`, expect.anything(), undefined);
        expect(result).toEqual(mockResponse.audioFiles);
      })
    );
  });
});

describe('Audio API - findChapterRecitationById', () => {
  it('should handle valid chapter and reciter IDs', async () => {
    fc.assert(
      fc.asyncProperty(fc.integer({min:1, max:114}), fc.string(), async (chapterId, reciterId) => {
        // Prepare mock response
        const mockResponse = { audioFile: { id: chapterId.toString(), reciterId } };
        fetcher.mockResolvedValue(mockResponse);

        // Call the function with the generated chapterId and reciterId
        const result = await audio.findChapterRecitationById(chapterId.toString(), reciterId);

        // Assertions
        expect(fetcher).toHaveBeenCalledWith(`/chapter_recitations/${reciterId}/${chapterId}`, expect.anything(), undefined);
        expect(result).toEqual(mockResponse.audioFile);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw an error for invalid chapter IDs', async () => {
    const validReciterId = 'a1b2c3';
    await expect(audio.findChapterRecitationById('115', validReciterId)).rejects.toThrow('Invalid chapter id');
    await expect(audio.findChapterRecitationById('0', validReciterId)).rejects.toThrow('Invalid chapter id');
    await expect(audio.findChapterRecitationById('abc', validReciterId)).rejects.toThrow('Invalid chapter id');
  });
});

describe('Audio API - findVerseRecitationsByChapter', () => {
  it('should handle valid chapter and recitation IDs with options', async () => {
    fc.assert(
      fc.asyncProperty(fc.integer({min: 1, max: 114}), fc.string(), fc.record({
        limit: fc.integer({min: 1, max: 50}),
        page: fc.integer({min: 1, max: 10})
      }), async (chapterId, recitationId, options) => {
        // Prepare mock response
        const mockResponse = {
          audioFiles: [{ id: '1', recitationId, chapterId: chapterId.toString() }],
          pagination: { totalRecords: 6236, totalPages: 10, currentPage: options.page, limit: options.limit }
        };
        fetcher.mockResolvedValue(mockResponse);

        // Call the function with the generated chapterId, recitationId, and options
        const result = await audio.findVerseRecitationsByChapter(chapterId.toString(), recitationId, options);

        // Assertions
        expect(fetcher).toHaveBeenCalledWith(
          `/recitations/${recitationId}/by_chapter/${chapterId}`,
          expect.objectContaining({
            limit: options.limit,
            page: options.page
          }),
          undefined
        );
        expect(result).toEqual(mockResponse);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw an error for invalid chapter IDs', async () => {
    const validRecitationId = 'a1b2c3';
    await expect(audio.findVerseRecitationsByChapter('115', validRecitationId)).rejects.toThrow('Invalid chapter id');
    await expect(audio.findVerseRecitationsByChapter('0', validRecitationId)).rejects.toThrow('Invalid chapter id');
    await expect(audio.findVerseRecitationsByChapter('abc', validRecitationId)).rejects.toThrow('Invalid chapter id');
  });
});

describe('Audio API - findVerseRecitationsByJuz', () => {
  it('should handle valid juz and recitation IDs with options', async () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 30 }), fc.string(), fc.record({
        limit: fc.integer({ min: 1, max: 50 }),
        page: fc.integer({ min: 1, max: 10 })
      }), async (juz, recitationId, options) => {
        // Prepare mock response
        const mockResponse = {
          audioFiles: [{ id: '1', recitationId, juz: juz.toString() }],
          pagination: { totalRecords: 6236, totalPages: 10, currentPage: options.page, limit: options.limit }
        };
        fetcher.mockResolvedValue(mockResponse);

        // Call the function with the generated juz, recitationId, and options
        const result = await audio.findVerseRecitationsByJuz(juz.toString(), recitationId, options);

        // Assertions
        expect(fetcher).toHaveBeenCalledWith(
          `/recitations/${recitationId}/by_juz/${juz}`,
          expect.objectContaining({
            limit: options.limit,
            page: options.page
          }),
          undefined
        );
        expect(result).toEqual(mockResponse);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw an error for invalid juz', async () => {
    const validRecitationId = 'a1b2c3';
    await expect(audio.findVerseRecitationsByJuz('31', validRecitationId)).rejects.toThrow('Invalid juz');
    await expect(audio.findVerseRecitationsByJuz('0', validRecitationId)).rejects.toThrow('Invalid juz');
    await expect(audio.findVerseRecitationsByJuz('abc', validRecitationId)).rejects.toThrow('Invalid juz');
  });
});



describe('Audio API - findVerseRecitationsByPage', () => {
  it('should handle valid page and recitation IDs with options', async () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 604 }), fc.string(), fc.record({
        limit: fc.integer({ min: 1, max: 50 }),
        page: fc.integer({ min: 1, max: 10 })
      }), async (pageNumber, recitationId, options) => {
        const mockResponse = {
          audioFiles: [{ id: '1', recitationId, pageNumber: pageNumber.toString() }],
          pagination: { totalRecords: 6236, totalPages: 10, currentPage: options.page, limit: options.limit }
        };
        fetcher.mockResolvedValue(mockResponse);

        const result = await audio.findVerseRecitationsByPage(pageNumber.toString(), recitationId, options);

        expect(fetcher).toHaveBeenCalledWith(
          `/recitations/${recitationId}/by_page/${pageNumber}`,
          expect.objectContaining({
            limit: options.limit,
            page: options.page
          }),
          undefined
        );
        expect(result).toEqual(mockResponse);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw an error for invalid page', async () => {
    const validRecitationId = 'a1b2c3';
    await expect(audio.findVerseRecitationsByPage('605', validRecitationId)).rejects.toThrow('Invalid page');
    await expect(audio.findVerseRecitationsByPage('0', validRecitationId)).rejects.toThrow('Invalid page');
    await expect(audio.findVerseRecitationsByPage('abc', validRecitationId)).rejects.toThrow('Invalid page');
  });
});


describe('Audio API - findVerseRecitationsByRub', () => {
  it('should handle valid rub and recitation IDs with options', async () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 240 }), fc.string(), fc.record({
        limit: fc.integer({ min: 1, max: 50 }),
        page: fc.integer({ min: 1, max: 10 })
      }), async (rubNumber, recitationId, options) => {
        const mockResponse = {
          audioFiles: [{ id: '1', recitationId, rubNumber: rubNumber.toString() }],
          pagination: { totalRecords: 6236, totalPages: 10, currentPage: options.page, limit: options.limit }
        };
        fetcher.mockResolvedValue(mockResponse);

        const result = await audio.findVerseRecitationsByRub(rubNumber.toString(), recitationId, options);

        expect(fetcher).toHaveBeenCalledWith(
          `/recitations/${recitationId}/by_rub/${rubNumber}`,
          expect.objectContaining({
            limit: options.limit,
            page: options.page
          }),
          undefined
        );
        expect(result).toEqual(mockResponse);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw an error for invalid rub', async () => {
    const validRecitationId = 'a1b2c3';
    await expect(audio.findVerseRecitationsByRub('241', validRecitationId)).rejects.toThrow('Invalid rub');
    await expect(audio.findVerseRecitationsByRub('0', validRecitationId)).rejects.toThrow('Invalid rub');
    await expect(audio.findVerseRecitationsByRub('abc', validRecitationId)).rejects.toThrow('Invalid rub');
  });
});


describe('Audio API - findVerseRecitationsByHizb', () => {
  it('should handle valid hizb and recitation IDs with options', async () => {
    fc.assert(
      fc.asyncProperty(fc.integer({ min: 1, max: 60 }), fc.string(), fc.record({
        limit: fc.integer({ min: 1, max: 50 }),
        page: fc.integer({ min: 1, max: 10 })
      }), async (hizbNumber, recitationId, options) => {
        const mockResponse = {
          audioFiles: [{ id: '1', recitationId, hizbNumber: hizbNumber.toString() }],
          pagination: { totalRecords: 6236, totalPages: 10, currentPage: options.page, limit: options.limit }
        };
        fetcher.mockResolvedValue(mockResponse);

        const result = await audio.findVerseRecitationsByHizb(hizbNumber.toString() as HizbNumber, recitationId, options);

        expect(fetcher).toHaveBeenCalledWith(
          `/recitations/${recitationId}/by_hizb/${hizbNumber}`,
          expect.objectContaining({
            limit: options.limit,
            page: options.page
          }),
          undefined
        );
        expect(result).toEqual(mockResponse);
      }),
      { numRuns: 100 }
    );
  });

  it('should throw an error for invalid hizb', async () => {
    const validRecitationId = 'a1b2c3';
    await expect(audio.findVerseRecitationsByHizb('61', validRecitationId)).rejects.toThrow('Invalid hizb');
    await expect(audio.findVerseRecitationsByHizb('0', validRecitationId)).rejects.toThrow('Invalid hizb');
    await expect(audio.findVerseRecitationsByHizb('abc', validRecitationId)).rejects.toThrow('Invalid hizb');
  });
});

import {VerseKey} from '../src/types/VerseKey';


// describe('Audio API - findVerseRecitationsByKey', () => {
 
  // it('should handle valid key and recitation IDs with options', async () => {
  //   const verseKeyArbitrary = fc.tuple(
  //     fc.integer({ min: 1, max: 114 }), // Valid chapter numbers
  //     fc.integer({ min: 1, max: 286 })  // Max number of verses in any chapter
  //   ).map(([chapter, verse]) => `${chapter}:${verse}`);

  //   const recitationIdArbitrary = fc.constant("lkdkk");
  
  //   fc.assert(
  //     fc.asyncProperty(verseKeyArbitrary, recitationIdArbitrary, fc.record({
  //       limit: fc.integer({ min: 1, max: 50 }),
  //       page: fc.integer({ min: 1, max: 10 })
  //     }), async (verseKey, recitationId, options) => {
  //       const mockResponse = {
  //         audioFiles: [{ id: '1', recitationId, key: verseKey }],
  //         pagination: { totalRecords: 6236, totalPages: 10, currentPage: options.page, limit: options.limit }
  //       };
  //       fetcher.mockResolvedValue(mockResponse);

  //       const result = await audio.findVerseRecitationsByKey(verseKey, recitationId, options);

  //       expect(fetcher).toHaveBeenCalledWith(
  //         `/recitations/${recitationId}/by_ayah/${verseKey}`,
  //         expect.objectContaining({
  //           limit: options.limit,
  //           page: options.page
  //         }),
  //         undefined
  //       );
  //       expect(result).toEqual(mockResponse);
  //     }),
  //     // { numRuns: 100 }
  //   );
  // });

  // it('should throw an error for Invalid verse key', async () => {
  //   const validRecitationId = 'a1b2c3';
  //   await expect(audio.findVerseRecitationsByKey('', validRecitationId)).rejects.toThrow('Invalid verse key');
  // });
// });
