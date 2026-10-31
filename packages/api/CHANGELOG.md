# @quranjs/api

## 3.15.1

### Patch Changes

- 3afbf26: Make the `isValid*` reference helpers accept only canonical values: positive integers, or strings of plain decimal digits without a sign, exponent, hex prefix, fraction, whitespace or leading zeros. `isValidVerseKey` now also rejects keys with extra `:` segments and always enforces the chapter's verse count, so keys such as `"01:300"`, `"1.5:1"` and `"1:1:1"` are rejected. SDK methods that guard on these helpers now throw before sending such requests.

## 3.15.0

### Minor Changes

- acb665b: Add optional `textImlaei` to typed Quran core word records for Content Sync snapshots. The new field may be absent from snapshots generated before the server-side backfill.

## 3.14.0

### Minor Changes

- 3945717: Add the optional `sourceApp` ({ name, url }) field and `QuranReflectPostSourceApp` type to `QuranReflectPost`. The backend adds it to post responses only for posts created by a configured partner app, so it is omitted for all other posts.

## 3.13.0

### Minor Changes

- 6721a73: Add first-class SDK methods and types for the Content v4 Qira'at endpoints (readers, transmitters, junctures, readings and matrix). These endpoints require the `qiraat.read` OAuth scope, which the server client now requests for Qira'at routes.

## 3.12.0

### Minor Changes

- 21d8975: Add optional `textIndopakNastaleeq` to typed Quran core word records for Content Sync snapshots and deprecate `textIndopak`, which is retained for backwards compatibility. The new field may be absent from snapshots generated before the server-side backfill.

## 3.11.0

### Minor Changes

- e8a8b32: Add typed Quran core word records with IndoPak and Uthmani Tajweed text for Content Sync snapshots.

## 3.10.1

### Patch Changes

- 2d98f9e: Add typed Content Sync snapshot records for chapter audio files and verse timing segments.

## 3.10.0

### Minor Changes

- 6bcf98a: Add typed `quran_core:1` Content Sync snapshot records for canonical Quran text, chapter metadata, and navigation boundaries.

## 3.9.0

### Minor Changes

- 19146fc: Add typed App State configuration, document, bootstrap, and changes APIs for public and server clients, including a structural transport contract, typed error narrowing, immutable mutation snapshots, and shared error identity across package entrypoints.

## 3.8.0

### Minor Changes

- b7cc01a: Add typed Content Sync support for word-by-word transliteration resources.

## 3.7.0

### Minor Changes

- 929940a: Add `chapter_recitations` to the Content Sync resource-group contract.

## 3.6.0

### Minor Changes

- 0002234: Add a server-only typed client for submitting Analytics Events batches with the `analytics.events.write` client-credentials scope.

## 3.5.0

### Minor Changes

- 0d41742: Add typed Mushaf resources and snapshot records to Content Sync.

## 3.4.1

### Patch Changes

- f645635: Add typed content sync support for word-by-word translation resources.

## 3.4.0

### Minor Changes

- 01176d4: Add typed QuranReflect post helpers for create, update, and get operations.

## 3.3.0

### Minor Changes

- 578e89a: Add content resource sync and snapshot SDK helpers.
- 4250b1e: Add first-class SDK methods and types for the public Content v4 answers endpoints.

## 3.2.1

### Patch Changes

- 61ef3d0: Export public OAuth session and token storage types from the `/public` entrypoint.

## 3.2.0

### Minor Changes

- 2a80a43: Add typed v4 hadith reference SDK methods and expose the full chapter info response with resource selection support.

## 3.1.0

### Minor Changes

- aba0feb: Update casing of params

## 3.0.0

### Major Changes

- 43052fd: Add runtime-split public and server SDK entrypoints, generated operation contracts, and server/client helpers for the updated Quran Foundation API flows.

### Patch Changes

- 0ba15c9: Add absolute audioUrl values to verse recitation responses.

## 2.2.0

### Minor Changes

- 99d13c5: Add by_range API support

## 2.1.0

### Minor Changes

- 3007985: Fix chapter recitation endpoints

## 2.0.1

### Patch Changes

- d28efab: Remove UMD from package.json
- 26bcaaa: Update search APIs

## 2.0.0

### Major Changes

- 90088e3: Migrate to the new quran.foundation API
