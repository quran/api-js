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
});

// describe('Verses API', () => {
// describe('findByHizb()', () => {
//   it('should return data', async () => {
//     const data = await verses.findByHizb('1');
//     expect(data).toBeInstanceOf(Array);
//   });

//   it('should throw with invalid id', () => {
//     expect(verses.findByHizb('0' as any)).rejects.toThrowError();
//   });
// });

// describe('findByRub()', () => {
//   test('it should return data', async () => {
//     const data = await verses.findByRub('1');
//     expect(data).toBeInstanceOf(Array);
//   });

//   test('should throw with invalid id', async () => {
//     expect(verses.findByRub('0' as any)).rejects.toThrowError();
//   });
// });

// });
