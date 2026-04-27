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

For browser or mobile apps, use `@quranjs/api/public`. Public usage docs live in the API docs portal.

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
