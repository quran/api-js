---
"@quranjs/api": minor
---

Add optional `textIndopakNastaleeq` to typed Quran core word records for Content Sync snapshots and deprecate `textIndopak`, which is retained for backwards compatibility. The new field may be absent from snapshots generated before the server-side backfill.
