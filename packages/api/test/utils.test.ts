import fc from "fast-check";
import { describe, expect, it } from "vitest";

import * as utils from "../src/utils";
import { versesMapping } from "../src/utils/verses-mapping";

describe("Utils", () => {
  describe(`isValidChapterId`, () => {
    it("should return true for valid chapter id", () => {
      // This will generate numbers in the range [1, 114]
      // and test them against the expected the value (which is truthy)
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 114 }), (chapterId) => {
          expect(utils.isValidChapterId(chapterId)).toBeTruthy();
        }),
      );
    });

    it("should return false for invalid chapter id (out of the range [1, 114])", () => {
      // Generate numbers that out of the range [1, 114]
      fc.assert(
        fc.property(fc.integer({ max: 0 }), (chapterIdString) => {
          expect(utils.isValidChapterId(chapterIdString)).toBeFalsy();
        }),
      );
      fc.assert(
        fc.property(fc.integer({ min: 115 }), (chapterIdString) => {
          expect(utils.isValidChapterId(chapterIdString)).toBeFalsy();
        }),
      );
    });

    it("should return false for invalid chapter id (random strings that do not represent numbers)", () => {
      // Generate random strings that do not represent numbers
      fc.assert(
        fc.property(
          fc.string().filter((s) => Number.isNaN(Number(s))),
          (chapterIdString) => {
            expect(utils.isValidChapterId(chapterIdString)).toBeFalsy();
          },
        ),
        { numRuns: 1000 },
      );
    });

    it("should return false for invalid chapter id (random strings that represent numbers that are out of the range [1, 114])", () => {
      // Generate random strings that represent numbers that are out of the range [1, 114]
      fc.assert(
        fc.property(
          fc
            .string()
            .filter(
              (s) =>
                Number.isInteger(Number(s)) &&
                (Number(s) > 114 || Number(s) <= 0),
            ),
          (chapterIdString) => {
            expect(utils.isValidChapterId(chapterIdString)).toBeFalsy();
          },
        ),
        { numRuns: 250 },
      );
    });

    it("should return false for non-integer chapter ids", () => {
      fc.assert(
        fc.property(
          fc
            .double({ min: 1, max: 114, noNaN: true })
            .filter((n) => !Number.isInteger(n)),
          (chapterId) => {
            expect(utils.isValidChapterId(chapterId)).toBe(false);
            expect(utils.isValidChapterId(String(chapterId))).toBe(false);
          },
        ),
      );
    });
  });

  describe(`isValidHizb`, () => {
    it("should return true for valid hizb", () => {
      expect(utils.isValidHizb(1)).toBeTruthy();
      expect(utils.isValidHizb(60)).toBeTruthy();
    });

    it("should return false for invalid hizb", () => {
      expect(utils.isValidHizb(0)).toBeFalsy();
      expect(utils.isValidHizb(61)).toBeFalsy();
      expect(utils.isValidHizb(-10)).toBeFalsy();
      expect(utils.isValidHizb(1.5)).toBe(false);
      expect(utils.isValidHizb("1.5")).toBe(false);
    });
  });

  describe(`isValidJuz`, () => {
    it("should return true for valid chapter id", () => {
      expect(utils.isValidJuz(1)).toBeTruthy();
    });

    it("should return false for invalid chapter id", () => {
      expect(utils.isValidJuz(0)).toBeFalsy();
      expect(utils.isValidJuz(31)).toBeFalsy();
      expect(utils.isValidJuz(-10)).toBeFalsy();
      expect(utils.isValidJuz(1.5)).toBe(false);
      expect(utils.isValidJuz("29.9")).toBe(false);
    });
  });

  describe(`isValidQuranPage`, () => {
    it("should return true for valid page", () => {
      expect(utils.isValidQuranPage(1)).toBeTruthy();
      expect(utils.isValidQuranPage(604)).toBeTruthy();
    });

    it("should return false for invalid page", () => {
      expect(utils.isValidQuranPage(0)).toBeFalsy();
      expect(utils.isValidQuranPage(605)).toBeFalsy();
      expect(utils.isValidQuranPage(-10)).toBeFalsy();
      expect(utils.isValidQuranPage(1.5)).toBe(false);
      expect(utils.isValidQuranPage("603.5")).toBe(false);
    });
  });

  describe(`isValidRub`, () => {
    it("should return true for valid rub", () => {
      expect(utils.isValidRub(1)).toBeTruthy();
      expect(utils.isValidRub(240)).toBeTruthy();
    });

    it("should return false for invalid rub", () => {
      expect(utils.isValidRub(0)).toBeFalsy();
      expect(utils.isValidRub(241)).toBeFalsy();
      expect(utils.isValidRub(-10)).toBeFalsy();
      expect(utils.isValidRub(1.5)).toBe(false);
      expect(utils.isValidRub("239.5")).toBe(false);
    });
  });

  describe(`isValidVerseKey`, () => {
    it("should return true for valid verse key", () => {
      expect(utils.isValidVerseKey("1:1")).toBeTruthy();
      expect(utils.isValidVerseKey("114:1")).toBeTruthy();
    });

    it("should return false for invalid verse key", () => {
      expect(utils.isValidVerseKey("0")).toBeFalsy();
      expect(utils.isValidVerseKey("1")).toBeFalsy();
      expect(utils.isValidVerseKey("0!0")).toBeFalsy();
      expect(utils.isValidVerseKey("!!")).toBeFalsy();
      expect(utils.isValidVerseKey(":")).toBeFalsy();
      expect(utils.isValidVerseKey("0:")).toBeFalsy();
    });

    it("should return true for every verse in the mushaf and false just past the end of each chapter", () => {
      let total = 0;
      for (const [chapter, verseCount] of Object.entries(versesMapping)) {
        for (let verse = 1; verse <= verseCount; verse += 1) {
          expect(utils.isValidVerseKey(`${chapter}:${verse}`)).toBe(true);
          total += 1;
        }
        expect(utils.isValidVerseKey(`${chapter}:${verseCount + 1}`)).toBe(
          false,
        );
      }
      expect(total).toBe(6236);
    });

    it("should still enforce the verse count when the chapter has a leading zero", () => {
      expect(utils.isValidVerseKey("01:7")).toBe(true);
      expect(utils.isValidVerseKey("01:8")).toBe(false);
      expect(utils.isValidVerseKey("02:300")).toBe(false);
    });

    it("should return false for non-integer chapter or verse numbers", () => {
      expect(utils.isValidVerseKey("1.5:1")).toBe(false);
      expect(utils.isValidVerseKey("1:1.5")).toBe(false);
      expect(utils.isValidVerseKey("1e1:999")).toBe(false);
    });

    it("should return false for keys with more than one separator", () => {
      expect(utils.isValidVerseKey("1:1:1")).toBe(false);
      expect(utils.isValidVerseKey("2:255:")).toBe(false);
    });
  });
});
