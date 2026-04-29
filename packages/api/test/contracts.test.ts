import { describe, expect, it } from "vitest";

import { operationCatalog } from "../src/generated/contracts";

describe("operation contracts", () => {
  it("loads every documented API surface from the synced OpenAPI contracts", () => {
    expect(Object.keys(operationCatalog.content.v4.operations).length).toBe(80);
    expect(Object.keys(operationCatalog.search.v1.operations).length).toBe(1);
    expect(Object.keys(operationCatalog.auth.v1.operations).length).toBeGreaterThan(
      20,
    );
    expect(
      Object.keys(operationCatalog.quranReflect.v1.operations).length,
    ).toBeGreaterThan(20);
    expect(Object.keys(operationCatalog.oauth2.v1.operations).length).toBe(5);
  });

  it("normalizes colon params into curly-brace params", () => {
    const noteOperation = Object.values(operationCatalog.auth.v1.operations).find(
      (operation) => operation.path.includes("/v1/notes/{noteId}"),
    );

    expect(noteOperation).toBeDefined();
  });
});
