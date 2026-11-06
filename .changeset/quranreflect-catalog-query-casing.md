---
"@quranjs/api": patch
---

Keep the camelCase query keys of the Quran Reflect reads in the content catalog (`client.content.v4.raw.postsControllerFeed()` and the other `postsController*` operations). They are served by Quran Reflect under `/quran-reflect/v1`, but their query keys were converted to snake_case like a content call, so `sortBy`, `postTypeIds`, `filter[verifiedOnly]` and `filter[references][0][chapterId]` went out as `sort_by`, `post_type_ids`, `filter[verified_only]` and `filter[references][0][chapter_id]`, which the API does not read. They are now sent as written, the same as through `client.quranReflect.v1.raw`. Content API queries are still sent in snake_case.
