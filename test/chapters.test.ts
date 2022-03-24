import { quran } from '@/index';

describe('Chapters API', () => {
  describe('findAll()', () => {
    it('should return data', () => {
      const data = quran.v4.chapters.findAll();
      expect(data).resolves.toBeInstanceOf(Array);
    });
  });

  describe('findById()', () => {
    it('should return data', () => {
      const data = quran.v4.chapters.findById(1);
      expect(data).resolves.toBeDefined();
    });

    it('should throw with invalid id', () => {
      const data = quran.v4.chapters.findById(0);
      expect(data).rejects.toThrowError();
    });
  });

  describe('findAll()', () => {
    test('it should return data', async () => {
      const data = quran.v4.chapters.findInfoById(1);
      expect(data).resolves.toBeDefined();
    });

    test('should throw with invalid id', async () => {
      const data = quran.v4.chapters.findInfoById(0);
      expect(data).rejects.toThrowError();
    });
  });
});
