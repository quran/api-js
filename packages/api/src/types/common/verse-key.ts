import { versesMapping } from "@/utils/verses-mapping";

import type { Increment, NumberRange } from "../utils";

/**
 * A `VerseKey` is a string literal in the form `${chapter}:${verse}` where:
 * - `chapter` is a valid chapter id from `versesMapping`
 * - `verse` is within the range 1..(verseCount for that chapter)
 */
export type VerseKey = {
  [TChapter in keyof typeof versesMapping & number]: `${TChapter}:${NumberRange<
    1,
    Increment<(typeof versesMapping)[TChapter] & number> & number
  >}`;
}[keyof typeof versesMapping & number];
