---
"@quranjs/api": minor
---

Add QuranReflect post formatting support and rendering helpers.

- `renderQuranReflectPostHtml(post, options?)` turns a post's `body`, `mentions` and `formatting` into escaped HTML with `<strong>`, `<em>`, `<u>`, `<ul>`/`<ol>` and mention and hashtag links.
- `getQuranReflectPostLines(post)` returns the same structure as lines of styled segments, for native rendering.
- `CreateQuranReflectPostPayload` and `UpdateQuranReflectPostPayload` accept `formatting` and `tags`.
- `QuranReflectPost` now types `formatting` and `tags`, and types `mentions` as `QuranReflectPostMentionOccurrence[]` (`id`, `username`, `displayName`, `location`), which is what the API returns. It was typed as the request shape (`userId`, `marker`) before.
