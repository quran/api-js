---
"@quranjs/api": patch
---

Add a `mushaf` option to `juzs.findAll()`, and pass the query of `client.content.v4.juzs.list()` through to it. `GET /juzs` documents `mushaf` for selecting the verse mapping set the juzs come from, but `findAll()` took no options and `list()` ignored its arguments, so callers could not choose a mapping set.
