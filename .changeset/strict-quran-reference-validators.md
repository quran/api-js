---
"@quranjs/api": patch
---

Reject non-integer chapter, juz, hizb, rub and page numbers in the `isValid*` helpers, and make `isValidVerseKey` reject keys with extra `:` segments and enforce the chapter's verse count for non-canonical chapter strings such as `"01:300"`. SDK methods that guard on these helpers now throw before sending such requests.
