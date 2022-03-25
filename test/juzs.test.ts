import { quran } from '@/index';

const juzs = quran.v4.juzs;

describe('Juzs API', () => {
  describe('findAll()', () => {
    it('should return data', async () => {
      const data = await juzs.findAll();
      expect(data).toBeInstanceOf(Array);
    });
  });
});
