---
"@quranjs/api": patch
---

Send `fields`, `wordFields` and `translationFields` unchanged when they are given as a comma-separated string or an array. They were always read as `{ field: true }` maps, so `fields: "text_uthmani,chapter_id"` went out as `fields=0,1,2,…,22` (the string's character indexes) and the API answered without the requested fields. This affected the `client.content.v4` helpers, raw catalog operations such as `client.content.v4.raw.translation()`, and `QuranClient`. `tafsirFields` maps are now sent as `tafsir_fields` like the other field lists, instead of being dropped.
