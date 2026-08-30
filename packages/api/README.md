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
replay pending writes with their original idempotency keys, then pull again.

Existing `QuranClient` imports from `@quranjs/api` remain supported for backwards compatibility:

```typescript
import { QuranClient } from "@quranjs/api";

const client = new QuranClient({
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

const chapters = await client.chapters.findAll();
```

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
