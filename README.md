![Quranjs Api Header](https://github.com/quran/api-js/raw/master/media/repo-header.png)

# Quran Foundation Content API - JavaScript SDK

This package provides a JavaScript SDK for the **Quran Foundation Content API** and works in both Node.js and the browser.

> **Full documentation is available at <https://api-docs.quran.foundation/sdk>.**

[![Build Status][build-badge]][build]
[![MIT License][license-badge]][license]
[![NPM Version][npm-badge]][npm]
[![Minziped Size][size-badge]][npm]
[![NPM Monthly downloads][downloads-badge]][npm]

## Installation

```bash
npm install @quranjs/api
```

or using pnpm / yarn:

```bash
pnpm add @quranjs/api
# or
yarn add @quranjs/api
```

## Quick Start

```js
import { configure, quran } from '@quranjs/api';

configure({
  clientId: '<YOUR_QF_CLIENT_ID>',
  clientSecret: '<YOUR_QF_CLIENT_SECRET>',
});

const chapters = await quran.qf.chapters.findAll();
console.log(chapters);
```

For more examples and a complete API reference, see the [SDK documentation](https://api-docs.quran.foundation/sdk).

## Migrating from previous versions

If you used an earlier version of this SDK, please check the migration guide on the [documentation site](https://api-docs.quran.foundation/sdk) for details on upgrading.

<!-- Links -->

[build-badge]: https://github.com/quran/api-js/workflows/CI/badge.svg
[build]: https://github.com/quran/api-js/actions?query=workflow%3ACI
[license-badge]: https://badgen.net/github/license/quranjs/api
[license]: https://github.com/quran/api-js/blob/master/LICENSE
[npm]: https://www.npmjs.com/package/@quranjs/api
[npm-badge]: https://badgen.net/npm/v/@quranjs/api
[downloads-badge]: https://img.shields.io/npm/dm/@quranjs/api.svg
[size-badge]: https://badgen.net/packagephobia/publish/@quranjs/api
