import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  checkCatalogs,
  generateCatalogs,
} from "../../../scripts/generate-operation-catalogs.mjs";

const writeJson = async (filePath, value) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

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
  it("builds compact server and public catalogs from OpenAPI specs", async () => {
    const sourceDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "quranjs-openapi-"),
    );

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
    const sourceDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "quranjs-openapi-"),
    );

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

  it("reports missing generated catalog files as out of date", async () => {
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
