---
"@quranjs/api": patch
---

Add the documented field names that the verse field-selection types were missing, so they can be requested without a cast, and type the properties they return. `VerseField` gains `textQpcHafs`, `textQpcNastaleeqHafs`, `textQpcNastaleeq` and `pageNumber`. `WordField` gains `textIndopakNastaleeq`, `textUthmaniTajweed`, `textQpcHafs`, `textImlaeiSimple`, `textUthmaniSimple`, `verseId`, `chapterId`, `lineNumber`, `lineV1` and `lineV2`. `TranslationField` gains `rubElHizbNumber`, `rukuNumber`, `manzilNumber` and `id`. `Verse`, `Word` and `Translation` declare the matching response properties. `TranslationField` `"rubNumber"` is sent as `rub_number`, which the API does not recognize, and `Translation.rubNumber` is never set: use `rubElHizbNumber`.
