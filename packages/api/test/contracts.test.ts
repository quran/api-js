import { describe, expect, it } from "vitest";

import { getOperationByName, operationCatalog } from "../src/generated/contracts";

const representativeOperations = [
  ["content", "v4", "getChapter", "get", "/chapters/{id}"],
  ["search", "v1", "searchControllerSearch", "get", "/v1/search"],
  ["auth", "v1", "getV1NotesByNoteId", "get", "/v1/notes/{noteId}"],
  ["quranReflect", "v1", "postsControllerFeed", "get", "/v1/posts/feed"],
  ["oauth2", "v1", "oauth2TokenExchange", "post", "/oauth2/token"],
] as const;

describe("operation contracts", () => {
  it.each(representativeOperations)(
    "loads %s %s %s from the synced OpenAPI contracts",
    (service, version, operationName, method, path) => {
      expect(getOperationByName(service, version, operationName)).toMatchObject({
        method,
        operationName,
        path,
        service,
        version,
      });
    },
  );

  it("normalizes colon params into curly-brace params", () => {
    const noteOperation = Object.values(operationCatalog.auth.v1.operations).find(
      (operation) => operation.path.includes("/v1/notes/{noteId}"),
    );

    expect(noteOperation).toBeDefined();
  });
});
