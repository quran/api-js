---
"@quranjs/api": patch
---

Make the `isValid*` reference helpers return `false` for values of the wrong type instead of throwing or coercing them. `isValidVerseKey` threw a `TypeError` for anything that is not a string, such as `undefined`, `null`, a number or an array, so SDK methods such as `verses.findByKey(undefined)` failed with `Cannot read properties of undefined (reading 'split')` instead of `Invalid verse key`. The numeric helpers (`isValidChapterId`, `isValidJuz`, `isValidHizb`, `isValidRub`, `isValidQuranPage`) threw for a symbol and accepted values that coerce to a valid number, such as `[1]`, `1n` or a boxed `"1"`; they now accept only numbers and strings.
