---
"@quranjs/api": patch
---

Make the `isValid*` reference helpers accept only canonical values: positive integers, or strings of plain decimal digits without a sign, exponent, hex prefix, fraction, whitespace or leading zeros. `isValidVerseKey` now also rejects keys with extra `:` segments and always enforces the chapter's verse count, so keys such as `"01:300"`, `"1.5:1"` and `"1:1:1"` are rejected. SDK methods that guard on these helpers now throw before sending such requests.
