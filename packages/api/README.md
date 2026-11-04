# @quranjs/api

[![NPM Version][npm-badge]][npm]
[![MIT License][license-badge]][license]
[![Build Status][build-badge]][build]
[![NPM Monthly downloads][downloads-badge]][npm]

A JavaScript/TypeScript library for fetching **authentic, scholarly verified Quran data** from the [Quran.com API](https://api-docs.quran.foundation/docs/category/content-apis).

Unlike other sources, this SDK connects you directly to the **[Quran Foundation](https://quran.foundation)**—ensuring a **trusted, highly scrutinized source** of reliable content, including properly licensed translations, tafsir, and supplementary materials.

Works in both server and browser environments through separate runtime entrypoints:

- `@quranjs/api/server`
- `@quranjs/api/public`

**Built by the [Quran Foundation](https://quran.foundation) — the team behind [Quran.com](https://quran.com)**

## Installation

```bash
# npm
npm install @quranjs/api

# yarn
yarn add @quranjs/api

# pnpm
pnpm add @quranjs/api
```

## Quick Start

```typescript
import { SearchMode } from "@quranjs/api";
import { createServerClient } from "@quranjs/api/server";

const client = createServerClient({
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const chapters = await client.content.v4.chapters.list();
const results = await client.search.v1.query({
  query: "mercy",
  mode: SearchMode.Quick,
});
```

### Content scopes

Quran Foundation is splitting the `content` scope into nine narrower read scopes
(`content.quran.read`, `content.audio.read`, and so on). Which scopes you request depends on the
credentials you have.

**Existing credentials (granted `content`).** Nothing changes. The default
`contentScopeMode: "legacy"` requests `content` for content calls, exactly as before, and keeps
working: `content` stays valid for clients that already have it.

**New credentials.** Today every newly issued client is still granted `content`, so the default
works for new clients too. Once Quran Foundation turns on the new-client policy, newly issued
clients are no longer granted `content`:

- A **backend (confidential) client** is issued the granular scopes. Use it from your server with
  `contentScopeMode: "granular"`:

  ```typescript
  const client = createServerClient({
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    contentScopeMode: "granular",
  });
  ```

- A **browser or mobile (public) client** gets no Content scope. Serve Content from your own
  backend, which calls the API with a confidential client as above. `@quranjs/api/public` already
  refuses Content calls for this reason.

The granular scopes authorize app (client-credentials) tokens, not user-bound tokens. The server
client reads Content with an app token by default, so no change is needed for that.

In `granular` mode the SDK requests the single scope each operation needs, taken from the pinned
operation catalog, so a call for chapters asks only for `content.quran.read`. Notes:

- Use `granular` only with credentials granted the granular scopes. With credentials granted only
  `content`, the token endpoint rejects the request with `invalid_scope`; the SDK reports that and
  names the scopes rather than retrying with a broader one.
- Operations without a typed convenience method remain available through the raw catalog client;
  for example, `client.content.v4.raw.listChapters()` requests `content.quran.read` from the same
  pinned catalog.
- Any raw catalog operation accepts an explicit scope list, which is requested exactly as given in
  either mode: `client.content.v4.raw.listChapters({ scopes: ["content.quran.read"] })`.
- The raw client only covers operations in the catalog, and there is no arbitrary
  `client.fetch(url)` facade. For a path absent from the catalog, call your fetch implementation
  directly and pass an explicit access token rather than guessing a scope.
- Qira'at endpoints (`client.qiraat.*`) are outside the split and request `qiraat.read` in both
  modes.
- `search` and `analytics.events.write` are separate permissions and are unaffected in both modes.
  A content call never requests them.
- The default will only change in a deliberately versioned release.

### Analytics Events

Analytics submission uses the `analytics.events.write` scope and is available
only from the server entrypoint. The SDK obtains and caches the required
client-credentials token. Keep `CLIENT_SECRET` in server-side environment
variables.

```typescript
const result = await client.analytics.v1.events.submit({
  events: [
    {
      eventId: crypto.randomUUID(),
      name: "quran.reader.verse_viewed",
      version: 1,
      occurredAt: new Date(),
      userId: "QURAN_FOUNDATION_USER_ID",
      sessionId: "session-123",
      properties: { verseKey: "2:255", surface: "reader" },
    },
    {
      eventId: crypto.randomUUID(),
      name: "quran.app.started",
      version: 1,
      occurredAt: new Date(),
      anonymousId: "anonymous-123",
    },
  ],
});
```

A successful response accepts the complete batch. Retry a failed batch with
the same event IDs so downstream processing can identify duplicates.

For browser or mobile apps, use `@quranjs/api/public`. Public usage docs live in the API docs portal.

### Qira'at

The Qira'at Content API v4 endpoints (readers, transmitters, junctures,
readings and the variant-reading matrix) require the `qiraat.read` scope (the
`qiraat` scope is also accepted), so your client must be granted it. They are
available only from the server entrypoint, which requests the scope
automatically for these endpoints.

```typescript
const { readers } = await client.qiraat.findAllReaders();
const junctures = await client.qiraat.findJuncturesByVerse("1:4");
const matrix = await client.qiraat.findMatrixByVerse("1:4");
const counts = await client.qiraat.countMatrixWithinRange("1:1", "2:10");

// Also available as client.content.v4.qiraat.readers.list(), etc.
```

### App State

App State stores app-owned JSON documents for signed-in users. It is available
from both runtime entrypoints under `client.auth.v1.appState`. Read the enabled
data groups before writing, use a fresh high-entropy idempotency key for each
logical mutation, and store quoted ETags unchanged.

```typescript
const config = await client.auth.v1.appState.getConfiguration();

const created = await client.auth.v1.appState.putDocument(
  "settings",
  "theme",
  { value: { mode: "dark" }, schemaVersion: 1 },
  { idempotencyKey: crypto.randomUUID(), ifNoneMatch: "*" },
);

const current = await client.auth.v1.appState.getDocument("settings", "theme");
await client.auth.v1.appState.putDocument(
  "settings",
  "theme",
  { value: { mode: "light" }, schemaVersion: 1 },
  { idempotencyKey: crypto.randomUUID(), ifMatch: current.etag! },
);
```

For offline startup, page through `bootstrap()` until `hasMore` is false and
then persist `nextSyncToken`. Apply each `getChanges()` page and its next token
atomically. On HTTP 410, preserve pending writes, bootstrap and drain changes,
replay pending writes, and then pull again. An unchanged replay request retains
its idempotency key; a conflict rebase rotates it with the changed fingerprint.

For transactional offline reconciliation, provide an account-scoped durable
`AppStateStore`. Its `transaction(accountId, reducer)` implementation must
initialize missing accounts, run the reducer synchronously, and atomically
commit the complete draft only when the reducer returns successfully. Reducers
must not perform network I/O. The reconciler stages bootstrap pages separately,
applies change pages with their tokens atomically, replays immutable local
replacements, and rejects responses from an account that is no longer active.

```typescript
import { createAppStateReconciler } from "@quranjs/api/public";

const appState = createAppStateReconciler({
  accountId: signedInAccountId, // Explicit identity; never derive it from a token.
  store: durableAppStateStore,
  transport: client.auth.v1.appState,
});

await appState.putDocument("settings", "theme", {
  schemaVersion: 1,
  value: { mode: "dark" },
});
await appState.reconcile();

const state = await appState.getState();
const theme = state.visible["settings/theme"];

await appState.switchAccount(
  nextSignedInAccountId,
  nextAccountClient.auth.v1.appState,
);
```

Account switching replaces the local account boundary and transport atomically. Create a separate
client/transport whose immutable session belongs to the target account; do not pass a facade that
reads a mutable cross-account session at request time. An in-flight request retains the transport
captured for its original account, and its late result cannot commit after the generation changes.

`putDocument()` and `deleteDocument()` only queue local mutations. Call
`reconcile()` to pull, replay the captured pending set, and pull again. Calls to
`reconcile()` are serialized, while local queue writes remain available. On a
strict `412` conflict, the complete replacement is rebased onto the refreshed
ETag with a new idempotency key. `createAppStateMemoryStore()` is available for
tests and short-lived sessions; it is not durable across process restarts.

### User Sync

The User Sync API (`GET /v1/sync` and `POST /v1/sync`) pulls and pushes
bookmark, collection, collection bookmark, note, reading bookmark and reading
session mutations. It is available from both runtime entrypoints under
`client.auth.v1.sync`. Every call needs a user token with the `sync` scope plus
the scope of each resource you sync (for example `bookmark`, `collection` or
`note`).

```typescript
import { isUserSyncOutOfSyncError } from "@quranjs/api/public";

const sync = client.auth.v1.sync;

// Pull every page for a stored cursor. Later pages are pinned to page 1's
// lastMutationAt; a later-page 409 restarts once from page 1 with the
// original cursor, up to `maxRestarts` (default 2) times.
const pulled = await sync.pullAllMutations({
  mutationsSince: storedCursor,
  resources: ["BOOKMARK", "NOTE"],
});
await applyLocally(pulled.mutations);
storedCursor = pulled.lastMutationAt; // Persist only after the final page.

try {
  const pushed = await sync.pushMutations({
    lastMutationAt: storedCursor,
    mutations: [
      {
        resource: "NOTE",
        type: "CREATE",
        data: { body: "...", ranges: ["2:255-2:255"] },
      },
    ],
  });
  storedCursor = pushed.data.lastMutationAt;
} catch (error) {
  if (isUserSyncOutOfSyncError(error)) {
    // Another device wrote first: pull, resolve conflicts, then push again.
  }
  throw error;
}
```

- `getMutations(options)` makes a single `GET /v1/sync` call. Pass
  `metadataOnly: true` to read only the current `lastMutationAt`.
- `pushMutations({ lastMutationAt, mutations })` sends at most 100 mutations.
  `lastMutationAt` must be the exact current sync head: use the value returned
  by `getMutations()` (or `metadataOnly: true`), `pullAllMutations()`, or the
  previous push, unchanged. A stale value returns a 409 that
  `isUserSyncOutOfSyncError()` recognizes.
- Both low-level methods return `mutationAt`, parsed from the `X-Mutation-At`
  response header. It is an optimistic write precondition only; never use it as
  a pull cursor.
- `pullAllMutations()` throws `UserSyncPullRestartLimitError` (with the last
  409 as `cause`) when it runs out of restarts. A 409 on page 1 and any other
  error are rethrown without a restart.

Existing `QuranClient` imports from `@quranjs/api` remain supported for backwards compatibility:

```typescript
import { QuranClient } from "@quranjs/api";

const client = new QuranClient({
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const chapters = await client.chapters.findAll();
```

`QuranClient` requests `content search` by default, as one token for every call. With credentials
that were never granted `content`, prefer `createServerClient` with `contentScopeMode: "granular"`,
which picks the scope for each call. If you keep `QuranClient`, set `scope` to every scope the
areas you call need:

| `QuranClient` area           | Scope                               |
| ---------------------------- | ----------------------------------- |
| `chapters`, `verses`, `juzs` | `content.quran.read`                |
| `audio`                      | `content.audio.read`                |
| `answers`                    | `content.answers.read`              |
| `hadithReferences`           | `content.hadith.read`               |
| `resources`                  | depends on the resource (see below) |
| `search`                     | `search`                            |

In `resources`: recitations, recitation styles and chapter reciters need `content.audio.read`;
translations `content.translations.read`; tafsirs `content.tafsirs.read`; chapter infos
`content.quran.read`; languages and verse media `content.metadata.read`; sync and snapshots
`content.sync.read`. For example, an app reading verses, audio and search sets
`scope: "content.quran.read content.audio.read search"`.

For new apps, prefer the runtime-specific `@quranjs/api/server` and `@quranjs/api/public` entrypoints.

## Documentation

For complete documentation, guides, and API reference, visit:

📚 **[SDK Documentation](https://api-docs.quran.foundation/docs/sdk/javascript)**

## Features

- 🚀 Full TypeScript support
- 🌐 Works in Node.js and browsers
- ✅ Scholarly verified data
- 📖 Access chapters, verses, juzs, and more
- 🔍 Full-text search
- 🎧 Audio recitations
- 🌍 Multiple verified translations and languages

## Content Sync

Bootstrap an approved public Mushaf, download its snapshot for offline use, and
then poll the same resource filter for incremental changes:

```ts
import type { MushafSnapshotRecord } from "@quranjs/api";

const changes = await client.resources.sync({
  bootstrap: true,
  resources: "mushafs:1",
});
const snapshot = await client.resources.findSnapshot<MushafSnapshotRecord>(
  "mushafs",
  1,
);
```

Mushaf snapshots include layout metadata, pages, publicly distributable font
assets, and words. Store the final `nextSyncToken` and use it with the same
`resources` filter on subsequent sync calls.

Chapter-recitation snapshots contain chapter audio files and their associated
verse and word timing segments. Segment timestamps and tuple boundaries are
milliseconds from the start of the chapter file; each tuple is
`[oneBasedWordIndex, startMs, endMs]`. Use `durationMs` for exact arithmetic;
`duration` is the legacy whole-seconds compatibility value.

```ts
import type { ChapterRecitationSnapshotRecord } from "@quranjs/api";

await client.resources.sync({
  bootstrap: true,
  resources: "chapter_recitations:159",
});
const chapterAudio =
  await client.resources.findSnapshot<ChapterRecitationSnapshotRecord>(
    "chapter_recitations",
    159,
  );

for (const record of chapterAudio.records) {
  if (record.recordType === "audio_segment") {
    console.log(record.verseKey, record.segments);
  }
}
```

Bootstrap returns `RESOURCE_CREATE` entries with `snapshotUrl`; it does not
return timing rows inline. Fetch and apply every referenced snapshot before
storing the final sync token. Apply incremental `audio_segment` row mutations
using `(resourceGroup, resourceId, recordType, recordKey)` as the stable local
key, not `sourceRecordId` or `data`, because either may be null for a delete.
When `RESOURCE_INVALIDATE` is returned, replace the complete
chapter-recitation snapshot.

Once published, the singleton `quran_core:1` provides canonical Uthmani verse
text, word-level IndoPak Nastaleeq, Imlaei and Uthmani Tajweed text, Surah
metadata, and Juz/Hizb/Rub-el-Hizb boundaries without duplicating them in every
Mushaf snapshot. Mushaf-specific pages and glyphs remain in `mushafs:<id>`. Word
records are exposed through the `QuranCoreWordSnapshotRecord` type; prefer
`textIndopakNastaleeq` for IndoPak word text (`textIndopak` is deprecated and
retained only for backwards compatibility). `textIndopakNastaleeq` is optional
and may be absent from snapshots generated before it was added; the same
applies to the optional `textImlaei` word field. Publication is pending
content/licensing approval.

```ts
import type { QuranCoreSnapshotRecord } from "@quranjs/api";

await client.resources.sync({
  bootstrap: true,
  resources: "mushafs:1;quran_core:1",
});
const core = await client.resources.findSnapshot<QuranCoreSnapshotRecord>(
  "quran_core",
  1,
);
for (const record of core.records) {
  if (record.recordType === "verse")
    console.log(record.verseKey, record.textUthmani);
  if (record.recordType === "word")
    console.log(
      record.location,
      record.textIndopakNastaleeq ?? record.textIndopak,
      record.textImlaei,
      record.textUthmaniTajweed,
    );
}
```

Word-by-word transliterations use their resource content ID and expose a typed,
camel-cased snapshot payload:

```ts
import type { WordByWordTransliterationSnapshotRecord } from "@quranjs/api";

await client.resources.sync({
  bootstrap: true,
  resources: "word_by_word_transliterations:60",
});

const transliterations =
  await client.resources.findSnapshot<WordByWordTransliterationSnapshotRecord>(
    "word_by_word_transliterations",
    60,
  );
```

## Links

- [Quran Foundation](https://quran.foundation) — Our mission to make the Quran accessible to everyone
- [API Documentation](https://api-docs.quran.foundation) — Full API reference
- [GitHub Repository](https://github.com/quran/api-js) — Source code and issues

## License

MIT © [Quran Foundation](https://quran.foundation)

<!-- Links -->

[npm]: https://www.npmjs.com/package/@quranjs/api
[npm-badge]: https://img.shields.io/npm/v/@quranjs/api
[license-badge]: https://img.shields.io/npm/l/@quranjs/api
[license]: https://github.com/quran/api-js/blob/main/LICENSE
[build-badge]: https://github.com/quran/api-js/workflows/CI/badge.svg
[build]: https://github.com/quran/api-js/actions?query=workflow%3ACI
[downloads-badge]: https://img.shields.io/npm/dm/@quranjs/api
