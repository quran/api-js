import { quran } from '../src/index';
import fc from 'fast-check';

const utils = quran.utils;

describe('Utils', () => {
  describe(`isValidChapterId`, () => {
    it('should return true for valid chapter id', () => {
      // This will generate numbers in the range [1, 114]
      // and test them against the expected the value (which is truthy)
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 114 }), (chaptedId) => {
          expect(utils.isValidChapterId(chaptedId)).toBeTruthy();
        })
      );
    });

    it('should return false for invalid chapter id (out of the range [1, 114])', () => {
      // Generate numbers that out of the range [1, 114]
      fc.assert(
        fc.property(fc.integer({ max: 0 }), (chaptedIdString) => {
          expect(utils.isValidChapterId(chaptedIdString)).toBeFalsy();
        })
      );
      fc.assert(
        fc.property(fc.integer({ min: 115 }), (chaptedIdString) => {
          expect(utils.isValidChapterId(chaptedIdString)).toBeFalsy();
        })
      );
    });

    it('should return false for invalid chapter id (random strings that do not represent numbers)', () => {
      // Generate random strings that do not represent numbers
      fc.assert(
        fc.property(
          fc.string().filter((s) => Number.isNaN(Number(s))),
          (chaptedIdString) => {
            expect(utils.isValidChapterId(chaptedIdString)).toBeFalsy();
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should return false for invalid chapter id (random strings that represent numbers that are out of the range [1, 114])', () => {
      // Generate random strings that represent numbers that are out of the range [1, 114]
      fc.assert(
        fc.property(
          fc
            .string()
            .filter(
              (s) =>
                Number.isInteger(Number(s)) &&
                (Number(s) > 114 || Number(s) <= 0)
            ),
          (chaptedIdString) => {
            expect(utils.isValidChapterId(chaptedIdString)).toBeFalsy();
          }
        ),
        { numRuns: 250 }
      );
    });
  });

  describe(`isValidHizb`, () => {
    it('should return true for valid hizb', () => {
      expect(utils.isValidHizb(1)).toBeTruthy();
      expect(utils.isValidHizb(60)).toBeTruthy();
    });

    it('should return false for invalid hizb', () => {
      expect(utils.isValidHizb(0)).toBeFalsy();
      expect(utils.isValidHizb(61)).toBeFalsy();
      expect(utils.isValidHizb(-10)).toBeFalsy();
    });
  });

  describe(`isValidJuz`, () => {
    it('should return true for valid chapter id', () => {
      expect(utils.isValidJuz(1)).toBeTruthy();
    });

    it('should return false for invalid chapter id', () => {
      expect(utils.isValidJuz(0)).toBeFalsy();
      expect(utils.isValidJuz(31)).toBeFalsy();
      expect(utils.isValidJuz(-10)).toBeFalsy();
    });
  });

  describe(`isValidQuranPage`, () => {
    it('should return true for valid page', () => {
      expect(utils.isValidQuranPage(1)).toBeTruthy();
      expect(utils.isValidQuranPage(604)).toBeTruthy();
    });

    it('should return false for invalid page', () => {
      expect(utils.isValidQuranPage(0)).toBeFalsy();
      expect(utils.isValidQuranPage(605)).toBeFalsy();
      expect(utils.isValidQuranPage(-10)).toBeFalsy();
    });
  });

  describe(`isValidRub`, () => {
    it('should return true for valid rub', () => {
      expect(utils.isValidRub(1)).toBeTruthy();
      expect(utils.isValidRub(240)).toBeTruthy();
    });

    it('should return false for invalid rub', () => {
      expect(utils.isValidRub(0)).toBeFalsy();
      expect(utils.isValidRub(241)).toBeFalsy();
      expect(utils.isValidRub(-10)).toBeFalsy();
    });
  });

  describe(`isValidVerseKey`, () => {
    it('should return true for valid verse key', () => {
      expect(utils.isValidVerseKey('1:1')).toBeTruthy();
      expect(utils.isValidVerseKey('114:1')).toBeTruthy();
    });

    it('should return false for invalid verse key', () => {
      expect(utils.isValidVerseKey('0')).toBeFalsy();
      expect(utils.isValidVerseKey('1')).toBeFalsy();
      expect(utils.isValidVerseKey('0!0')).toBeFalsy();
      expect(utils.isValidVerseKey('!!')).toBeFalsy();
      expect(utils.isValidVerseKey(':')).toBeFalsy();
      expect(utils.isValidVerseKey('0:')).toBeFalsy();
    });
  });
});
