import { quran } from '@/index';

describe('Utils', () => {
  describe(`isValidChapterId`, () => {
    it('should return true for valid chapter id', () => {
      expect(quran.utils.isValidChapterId(1)).toBeTruthy();
    });

    it('should return false for invalid chapter id', () => {
      expect(quran.utils.isValidChapterId(0)).toBeFalsy();
      expect(quran.utils.isValidChapterId(115)).toBeFalsy();
      expect(quran.utils.isValidChapterId(-10)).toBeFalsy();
    });
  });
});
