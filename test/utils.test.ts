import { quran } from '../src/index';

const utils = quran.utils;

describe('Utils', () => {
  describe(`isValidChapterId`, () => {
    it('should return true for valid chapter id', () => {
      expect(utils.isValidChapterId(1)).toBeTruthy();
    });

    it('should return false for invalid chapter id', () => {
      expect(utils.isValidChapterId(0)).toBeFalsy();
      expect(utils.isValidChapterId(115)).toBeFalsy();
      expect(utils.isValidChapterId(-10)).toBeFalsy();
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
