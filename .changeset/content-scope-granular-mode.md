---
"@quranjs/api": minor
---

Add opt-in `contentScopeMode: "granular"` for the content scope split.

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
