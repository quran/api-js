---
"@quranjs/api": minor
---

Add typed User Sync API support under `client.auth.v1.sync` on the public and server clients: `getMutations()` (`GET /v1/sync`), `pushMutations()` (`POST /v1/sync`) and `pullAllMutations()`, which pages through a cursor while honoring the continuation contract and restarts from page 1 after a later-page 409. Responses expose the `X-Mutation-At` header as `mutationAt`. Add `isUserSyncOutOfSyncError()` for 409 `OutOfSyncError` responses and `UserSyncPullRestartLimitError`. Regenerate the operation catalogs, which also adds `GET /v1/rooms/{id}/invitation-status`.
