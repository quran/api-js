import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));

const writeJson = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const loadCatalogModule = async ({ pin, pinDirectory = false } = {}) => {
  const sourcePath = path.resolve(
    testDir,
    "../../../scripts/generate-operation-catalogs.mjs",
  );
  const source = await fs.readFile(sourcePath, "utf8");
  const moduleDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "quranjs-catalog-module-"),
  );
  const modulePath = path.join(moduleDir, "generate-operation-catalogs.mjs");

  await fs.writeFile(modulePath, source.replace(/^#!.*(?:\r?\n|$)/, ""));
  const pinPath = path.join(moduleDir, "openapi-source.json");
  if (pinDirectory) await fs.mkdir(pinPath);
  else if (pin !== undefined) await fs.writeFile(pinPath, pin);

  return import(pathToFileURL(modulePath).href);
};

const catalogModule = loadCatalogModule();

const operation = (
  operationId,
  servers,
  security = [{ "x-auth-token": [] }],
) => ({
  get: {
    operationId,
    security,
    servers,
    tags: ["Generated"],
  },
});

describe("operation catalog generator", () => {
  it("rejects malformed committed pins instead of falling back to main", async () => {
    const { generateCatalogs } = await loadCatalogModule({ pin: "{broken" });
    await expect(generateCatalogs({ sourceDir: "/unused" })).rejects.toBeInstanceOf(SyntaxError);
  });

  it("propagates pin read errors other than ENOENT", async () => {
    const { generateCatalogs } = await loadCatalogModule({ pinDirectory: true });
    await expect(generateCatalogs({ sourceDir: "/unused" })).rejects.toMatchObject({ code: "EISDIR" });
  });

  it("builds compact server and public catalogs from OpenAPI specs", async () => {
    const { generateCatalogs } = await catalogModule;
    const sourceDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "quranjs-openapi-"),
    );

    await writeJson(path.join(sourceDir, "analytics", "v1.json"), {
      paths: {
        "/v1/events:batch": {
          post: {
            operationId: "submit_analytics_events",
            security: [{ "x-auth-token": [] }],
            tags: ["Analytics Events"],
          },
        },
      },
      servers: [{ url: "https://apis.quran.foundation/analytics" }],
    });
    await writeJson(path.join(sourceDir, "content", "v4.json"), {
      paths: {
        "/chapters/{id}": operation("GET-chapter"),
        "/quran-reflect/v1/posts/feed": operation("PostsController_feed", [
          { url: "https://apis.quran.foundation" },
        ]),
      },
      servers: [{ url: "https://apis.quran.foundation/content/api/v4" }],
    });
    await writeJson(path.join(sourceDir, "search", "v1.json"), {
      paths: {
        "/api/v1/search": operation("SearchController_search"),
      },
      servers: [{ url: "https://apis.quran.foundation/search" }],
    });
    await writeJson(path.join(sourceDir, "oauth2-apis", "v1.json"), {
      paths: {
        "/oauth2/auth": operation("oAuth2Authorize", [], []),
        "/userinfo": operation("getOidcUserInfo", [], [{ bearerToken: [] }]),
      },
      servers: [{ url: "https://oauth2.quran.foundation" }],
    });
    await writeJson(path.join(sourceDir, "user-related-apis", "v1.json"), {
      paths: {
        "/v1/collections": {
          get: {
            operationId: "authGetV1Collections",
            servers: [{ url: "https://apis.quran.foundation/auth" }],
          },
        },
        "/v1/posts/feed": {
          get: {
            operationId: "PostsController_feed",
            servers: [{ url: "https://apis.quran.foundation/quran-reflect" }],
          },
        },
      },
      servers: [{ url: "https://apis.quran.foundation/auth" }],
    });

    const catalogs = await generateCatalogs({ sourceDir });

    expect(catalogs.operationCatalog).toMatchObject({
      analytics: {
        v1: {
          operations: {
            submitAnalyticsEvents: {
              auth: "app",
              method: "post",
              path: "/v1/events:batch",
            },
          },
          service: "analytics",
          version: "v1",
        },
      },
      auth: {
        v1: {
          operations: {
            getV1Collections: {
              auth: "user",
              method: "get",
              path: "/v1/collections",
            },
          },
          service: "auth",
          version: "v1",
        },
      },
      content: {
        v4: {
          operations: {
            getChapter: {
              auth: "app",
              method: "get",
              path: "/chapters/{id}",
            },
            postsControllerFeed: {
              auth: "app",
              method: "get",
              path: "/quran-reflect/v1/posts/feed",
            },
          },
        },
      },
      oauth2: {
        v1: {
          operations: {
            getOidcUserInfo: {
              auth: "user",
              method: "get",
              path: "/userinfo",
            },
            oAuth2Authorize: {
              auth: "none",
              method: "get",
              path: "/oauth2/auth",
            },
          },
        },
      },
      search: {
        v1: {
          operations: {
            searchControllerSearch: {
              auth: "app",
              method: "get",
              path: "/v1/search",
            },
          },
        },
      },
    });
    expect(catalogs.publicOperationCatalog).toMatchObject({
      auth: {
        v1: {
          operations: {
            getV1Collections: {
              auth: "user",
              method: "get",
              path: "/v1/collections",
            },
          },
        },
      },
      oauth2: {
        v1: {
          operations: {
            getOidcUserInfo: {
              auth: "user",
              method: "get",
              path: "/userinfo",
            },
          },
        },
      },
      quranReflect: {
        v1: {
          operations: {
            postsControllerFeed: {
              auth: "user",
              method: "get",
              path: "/v1/posts/feed",
            },
          },
        },
      },
    });
  });

  it("suffixes duplicate normalized operation names deterministically", async () => {
    const { generateCatalogs } = await catalogModule;
    const sourceDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "quranjs-openapi-"),
    );

    await writeJson(path.join(sourceDir, "analytics", "v1.json"), {
      paths: {},
    });
    await writeJson(path.join(sourceDir, "content", "v4.json"), {
      paths: {},
    });
    await writeJson(path.join(sourceDir, "search", "v1.json"), {
      paths: {},
    });
    await writeJson(path.join(sourceDir, "oauth2-apis", "v1.json"), {
      paths: {},
    });
    await writeJson(path.join(sourceDir, "user-related-apis", "v1.json"), {
      paths: {
        "/v1/users/{id}": {
          get: {
            operationId: "UsersController_getUserProfile",
            servers: [{ url: "https://apis.quran.foundation/quran-reflect" }],
          },
        },
        "/v1/users/{username}/profile": {
          get: {
            operationId: "UsersController_getUserProfile",
            servers: [{ url: "https://apis.quran.foundation/quran-reflect" }],
          },
        },
      },
    });

    const catalogs = await generateCatalogs({ sourceDir });

    expect(
      Object.keys(catalogs.operationCatalog.quranReflect.v1.operations),
    ).toEqual([
      "usersControllerGetUserProfile",
      "usersControllerGetUserProfile2",
    ]);
  });

  describe("content scope contract hash", () => {
    const CONTRACT_TEXT = '{\n  "contractVersion": "content-scopes.v1"\n}\n';

    const writeScopedSource = async (contractSha256, contractText = CONTRACT_TEXT) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "quranjs-docs-"));
      const sourceDir = path.join(root, "openAPI");
      for (const file of ["analytics/v1.json", "search/v1.json", "oauth2-apis/v1.json", "user-related-apis/v1.json"]) {
        await writeJson(path.join(sourceDir, file), { paths: {} });
      }
      await writeJson(path.join(sourceDir, "content", "v4.json"), {
        paths: {
          "/chapters": {
            get: {
              operationId: "list-chapters",
              "x-qf-scopes": {
                contractSha256,
                contractVersion: "content-scopes.v1",
                granularAnyOf: ["content.quran.read"],
                legacyAnyOf: ["content"],
                quotaBuckets: ["content"],
              },
            },
          },
        },
      });
      if (contractText !== null) {
        await fs.mkdir(path.join(root, "contracts", "content-scopes"), { recursive: true });
        await fs.writeFile(path.join(root, "contracts", "content-scopes", "v1.json"), contractText);
      }
      return sourceDir;
    };

    it("carries contractSha256 into the generated scopes", async () => {
      const { generateCatalogs, hashContract } = await catalogModule;
      const hash = hashContract(CONTRACT_TEXT);
      const catalogs = await generateCatalogs({ sourceDir: await writeScopedSource(hash) });

      expect(catalogs.operationCatalog.content.v4.operations.listChapters.scopes).toEqual({
        contractSha256: hash,
        contractVersion: "content-scopes.v1",
        granularAnyOf: ["content.quran.read"],
        legacyAnyOf: ["content"],
      });
    });

    it("hashes CRLF contracts the way qf-api-docs does", async () => {
      const { hashContract } = await catalogModule;
      expect(hashContract(CONTRACT_TEXT.split("\n").join("\r\n"))).toBe(hashContract(CONTRACT_TEXT));
    });

    it("fails when x-qf-scopes names a hash the contract file does not have", async () => {
      const { generateCatalogs } = await catalogModule;
      await expect(
        generateCatalogs({ sourceDir: await writeScopedSource("0".repeat(64)) }),
      ).rejects.toThrow(/metadata is stale relative to the contract/u);
    });

    it("fails when scoped metadata has no contract file to verify against", async () => {
      const { generateCatalogs } = await catalogModule;
      await expect(
        generateCatalogs({ sourceDir: await writeScopedSource("0".repeat(64), null) }),
      ).rejects.toThrow(/cannot be verified/u);
    });

    it("fails when the pinned contract differs from the recorded contractSha256", async () => {
      const { hashContract, verifyContentScopeContract } = await catalogModule;
      const actual = hashContract(CONTRACT_TEXT);

      expect(() =>
        verifyContentScopeContract({
          contentSpec: { paths: {} },
          contractText: CONTRACT_TEXT,
          recordedSha256: "f".repeat(64),
          source: "qf-api-docs@pinned",
        }),
      ).toThrow(new RegExp(`hashes to ${actual}, but scripts/openapi-source.json records contractSha256 ${"f".repeat(64)}`, "u"));

      expect(
        verifyContentScopeContract({
          contentSpec: { paths: {} },
          contractText: CONTRACT_TEXT,
          recordedSha256: actual,
        }),
      ).toBe(actual);
    });

    it("rejects a malformed recorded contractSha256 in the pin", async () => {
      const { generateCatalogs } = await loadCatalogModule({
        pin: JSON.stringify({ contractSha256: "ecfced43", ref: "a".repeat(40), repository: "quran/qf-api-docs" }),
      });
      await expect(generateCatalogs({ sourceDir: "/unused" })).rejects.toThrow(/64-character/u);
    });
  });

  it("reports missing generated catalog files as out of date", async () => {
    const { checkCatalogs } = await catalogModule;
    const outputDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "quranjs-catalog-output-"),
    );
    const catalogs = {
      operationCatalog: {},
      publicOperationCatalog: {},
    };

    await expect(checkCatalogs(catalogs, outputDir)).resolves.toEqual([
      path.join(outputDir, "operation-catalog.json"),
      path.join(outputDir, "public-operation-catalog.json"),
    ]);
  });
});
