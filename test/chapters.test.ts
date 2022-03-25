import { quran } from '@/index';

const chapters = quran.v4.chapters;

describe('Chapters API', () => {
  describe('findAll()', () => {
    it('should return data', async () => {
      const data = await chapters.findAll();
      expect(data).toBeInstanceOf(Array);
    });
  });

  describe('findById()', () => {
    it('should return data', async () => {
      const data = await chapters.findById('1');
      expect(data).toBeDefined();
    });

    it('should throw with invalid id', () => {
      expect(chapters.findById('0' as any)).rejects.toThrowError();
    });
  });

  describe('findAll()', () => {
    test('it should return data', async () => {
      const data = await chapters.findInfoById('1');
      expect(data).toBeDefined();
    });

    test('should throw with invalid id', () => {
      expect(chapters.findInfoById('0' as any)).rejects.toThrowError();
    });
  });
});
