---
"@quranjs/api": patch
---

Type the verse and word timings that `audio.findChapterRecitationById()` returns. `ChapterRecitation` gains an optional `timestamps` array of `ChapterRecitationTimestamp` (`verseKey`, `timestampFrom`, `timestampTo`, `duration`, and `segments` as `[wordIndex, startMs, endMs]` triplets when requested), and the method takes a typed `segments` option for word timings. The API already returned these fields, but the type did not declare them, so reading them needed a cast.
