---
"@quranjs/api": minor
---

Add opt-in `contentScopeMode: "granular"` for the content scope split.

Quran Foundation is splitting the `content` scope into nine narrower read scopes. This release
lets the SDK request the specific scope each content operation needs, taken from the pinned
operation catalog, instead of one service-wide `content` scope.

**Nothing changes unless you opt in.** `contentScopeMode` defaults to `"legacy"`, which reproduces
the previous behaviour exactly, including the existing special handling of the public QuranReflect
reads. Existing credentials and existing code keep working with no change. The default will only
change in a deliberately versioned major release.

Set `contentScopeMode: "granular"` when your credentials were issued with the granular scopes.
Those scopes are not issued to any client yet, so no current integration is affected. Credentials
granted only `content` must stay on the default: the token endpoint would reject a granular
request with `invalid_scope`.

This is the minimum release that supports granular-only credentials. Earlier versions hard-code a
`content` scope request and cannot work with credentials that were never granted it.

Also in this release:

- App access tokens are cached per issuer, client, audience and canonical scope set, so a token
  from one issuer is never reused against another, and scope ordering no longer creates duplicate
  cache entries.
- Concurrent calls needing the same scopes share a single client-credentials request instead of
  opening several identical ones.
- When the authorization server reports the scopes it granted, the SDK checks the token can serve
  the call. A narrower grant is accepted, per RFC 6749 section 3.3; a grant sharing nothing with
  the request now fails immediately with both scope lists named, rather than surfacing later as an
  opaque 403.
- An `invalid_scope` rejection or an insufficient-scope response is reported with the requested
  scopes and never retried with a broader scope.
- `generate-operation-catalogs` accepts `--source-ref <git-ref>` to pin the OpenAPI revision, and
  warns when a build reads the mutable `main` branch of qf-api-docs.
