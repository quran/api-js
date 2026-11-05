# @quranjs/api

## 3.17.1

### Patch Changes

- 0bdd30c: Send `fields`, `wordFields` and `translationFields` unchanged when they are given as a comma-separated string or an array. They were always read as `{ field: true }` maps, so `fields: "text_uthmani,chapter_id"` went out as `fields=0,1,2,…,22` (the string's character indexes) and the API answered without the requested fields. This affected the `client.content.v4` helpers, raw catalog operations such as `client.content.v4.raw.translation()`, and `QuranClient`. `tafsirFields` maps are now sent as `tafsir_fields` like the other field lists, instead of being dropped.
- f9465d6: User Sync errors now carry the service's error code and message. A 409 `OutOfSyncError` from `client.auth.v1.sync` has `code: "OutOfSyncError"` and a message such as `409: Invalid lastMutationAt, please re-sync your data and try again.` instead of `409 `, for both the Gateway and direct backend response shapes. `isUserSyncOutOfSyncError` is unchanged.
- 8e9012c: Add an `audio` option to the verses methods for the ayah-by-ayah recitation ID, which is the parameter the Content API v4 verses endpoints read. The existing `reciter` option was sent as `reciter`, which those endpoints ignore, so verses never came back with `audio`. `reciter` is now deprecated and sent as `audio`; when both are set, `audio` wins.

## 3.17.0

### Minor Changes

- 9207061: Add opt-in `contentScopeMode: "granular"` for the content scope split.

  Quran Foundation is splitting the `content` scope into nine narrower read scopes. This release
  lets the SDK request the specific scope each content operation needs, taken from the pinned
  operation catalog, instead of one service-wide `content` scope.

  **Existing credentials: nothing changes.** `contentScopeMode` defaults to `"legacy"`, which
  reproduces the previous behaviour exactly, including the existing special handling of the public
  QuranReflect reads and `qiraat.read` for Qira'at. Credentials granted `content` keep working with
  no code change, and must stay on the default: the token endpoint rejects a granular request from
  them with `invalid_scope`. The default will only change in a deliberately versioned major release.

  **New credentials.** Today newly issued clients are still granted `content`, so the default works
  for them as well. Once Quran Foundation turns on the new-client policy, a newly issued backend
  (confidential) client is granted the granular scopes instead of `content` and should use
  `createServerClient` with `contentScopeMode: "granular"`. A newly issued browser or mobile (public)
  client gets no Content scope and should serve Content from its own backend.

  With this release, credentials that were never granted `content` can be used through
  `createServerClient` with `contentScopeMode: "granular"`, through an explicit per-request `scopes`
  list, or through the legacy `QuranClient` with an explicit `scope`. Earlier versions always request
  `content` (`content search` in `QuranClient`) and cannot use such credentials.

  Also in this release:
  - `OperationRequest.scopes` sets the client-credentials scopes for one app-authenticated call, in
    either mode, for operations the catalog has no scope for. The SDK requests exactly those scopes.
  - `QuranClientConfig.scope` replaces the `QuranClient` default of `content search`.
  - Qira'at operations are outside the split and request `qiraat.read` in both modes.
  - An app-token 401 or 403 is still a `QuranHttpError` with its `status`, `headers` and `payload`.
    On a 403 its message now also names the requested scopes and, for content calls in legacy mode,
    the `contentScopeMode` switch. On a 401 the refused app token is dropped from the cache so the
    next call fetches a fresh one. Neither these nor an `invalid_scope` rejection is ever retried
    with a broader scope.
  - `QuranClient` drops its cached token when its issuer, client, secret or scope changes, including
    a token request already in flight when the configuration changed.
  - App access tokens are cached per issuer, client, audience and canonical scope set, so a token
    from one issuer is never reused against another, and scope ordering no longer creates duplicate
    cache entries.
  - Concurrent calls needing the same scopes share a single client-credentials request instead of
    opening several identical ones.
  - When the authorization server reports the scopes it granted, the SDK checks the token can serve
    the call. A narrower grant is accepted, per RFC 6749 section 3.3; a grant sharing nothing with
    the request now fails immediately with both scope lists named, rather than surfacing later as an
    opaque 403.
  - The generated content catalog records the `contractSha256` of the qf-api-docs content scope
    contract it came from, and catalog generation fails when the pinned docs revision's contract no
    longer matches the recorded hash.
  - The operation catalog is regenerated from the revised qf-api-docs contract, which adds the
    content scope metadata.
  - `generate-operation-catalogs` accepts `--source-ref <git-ref>` to pin the OpenAPI revision, and
    warns when a build reads the mutable `main` branch of qf-api-docs.

## 3.16.0

### Minor Changes

- f858c1a: Add typed User Sync API support under `client.auth.v1.sync` on the public and server clients: `getMutations()` (`GET /v1/sync`), `pushMutations()` (`POST /v1/sync`) and `pullAllMutations()`, which pages through a cursor while honoring the continuation contract and restarts from page 1 after a later-page 409. Responses expose the `X-Mutation-At` header as `mutationAt`. Add `isUserSyncOutOfSyncError()` for 409 `OutOfSyncError` responses and `UserSyncPullRestartLimitError`. Regenerate the operation catalogs, which also adds `GET /v1/rooms/{id}/invitation-status`.

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
