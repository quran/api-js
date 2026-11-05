---
"@quranjs/api": patch
---

User Sync errors now carry the service's error code and message. A 409 `OutOfSyncError` from `client.auth.v1.sync` has `code: "OutOfSyncError"` and a message such as `409: Invalid lastMutationAt, please re-sync your data and try again.` instead of `409 `, for both the Gateway and direct backend response shapes. `isUserSyncOutOfSyncError` is unchanged.
