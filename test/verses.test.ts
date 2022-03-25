import { quran } from '@/index';

const verses = quran.v4.verses;

describe('Verses API', () => {
  describe('findByChapter()', () => {
    it('should return data', async () => {
      const data = await verses.findByChapter('1');
      expect(data).toBeInstanceOf(Array);
    });

    it('should fail with invalid chapter id', () => {
      expect(verses.findByChapter('0' as any)).rejects.toThrowError();
    });
  });

  // describe('findByHizb()', () => {
  //   it('should return data', async () => {
  //     const data = await verses.findByHizb('1');
  //     expect(data).toBeInstanceOf(Array);
  //   });

  //   it('should throw with invalid id', () => {
  //     expect(verses.findByHizb('0' as any)).rejects.toThrowError();
  //   });
  // });

  describe('findByJuz()', () => {
    test('it should return data', async () => {
      const data = await verses.findByJuz('1');
      expect(data).toBeInstanceOf(Array);
    });

    test('should throw with invalid id', async () => {
      expect(verses.findByJuz('0' as any)).rejects.toThrowError();
    });
  });

  describe('findByKey()', () => {
    test('it should return data', async () => {
      const data = await verses.findByKey('1:1');
      expect(data).toBeDefined();
    });

    test('should throw with invalid id', async () => {
      expect(verses.findByKey('0' as any)).rejects.toThrowError();
    });
  });

  describe('findByPage()', () => {
    test('it should return data', async () => {
      const data = await verses.findByPage('1');
      expect(data).toBeInstanceOf(Array);
    });

    test('should throw with invalid id', async () => {
      expect(verses.findByPage('0' as any)).rejects.toThrowError();
    });
  });

  // describe('findByRub()', () => {
  //   test('it should return data', async () => {
  //     const data = await verses.findByRub('1');
  //     expect(data).toBeInstanceOf(Array);
  //   });

  //   test('should throw with invalid id', async () => {
  //     expect(verses.findByRub('0' as any)).rejects.toThrowError();
  //   });
  // });

  describe('findRandom()', () => {
    test('it should return data', async () => {
      const data = await verses.findRandom();
      expect(data).toBeDefined();
    });
  });
});
