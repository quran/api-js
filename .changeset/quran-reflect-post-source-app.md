---
"@quranjs/api": minor
---

Add the optional `sourceApp` ({ name, url }) field and `QuranReflectPostSourceApp` type to `QuranReflectPost`. The backend adds it to post responses only for posts created by a configured partner app, so it is omitted for all other posts.
