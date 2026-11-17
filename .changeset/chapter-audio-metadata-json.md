---
"@quranjs/api": patch
---

`ChapterAudioFileSnapshotRecord.metadata` is now typed `Record<string, unknown> | string | null`, matching what Content Sync returns: it is a legacy field passed through as stored, and for some older files it is a Ruby hash dump string rather than an object. Added the optional `metadataJson` field (`Record<string, unknown> | null`), which carries the same audio tags as a JSON object; read it instead of `metadata`.
