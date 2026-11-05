---
"@quranjs/api": patch
---

Add an `audio` option to the verses methods for the ayah-by-ayah recitation ID, which is the parameter the Content API v4 verses endpoints read. The existing `reciter` option was sent as `reciter`, which those endpoints ignore, so verses never came back with `audio`. `reciter` is now deprecated and sent as `audio`; when both are set, `audio` wins.
