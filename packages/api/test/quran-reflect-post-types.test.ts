import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const formatDiagnostics = (diagnostics: readonly ts.Diagnostic[]): string =>
  diagnostics
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      );
      if (!diagnostic.file || diagnostic.start === undefined) {
        return `TS${diagnostic.code}: ${message}`;
      }

      const position = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start,
      );
      const location = [
        path.basename(diagnostic.file.fileName),
        position.line + 1,
        position.character + 1,
      ].join(":");
      return `${location} TS${diagnostic.code}: ${message}`;
    })
    .join("\n");

describe("QuranReflect post type surface", () => {
  it("types direct post payload helpers and the compatibility request shape", () => {
    const sourceFile = path.join(
      process.cwd(),
      "test",
      "__quran-reflect-post-types.ts",
    );
    const source = `
      import type {
        CreateQuranReflectPostPayload,
        QuranReflectPostMutationResponse,
      } from "@quranjs/api";
      import { createPublicClient } from "@quranjs/api/public";
      import { createServerClient } from "@quranjs/api/server";

      const payload: CreateQuranReflectPostPayload = {
        body: "Reflection text",
        draft: false,
        mentions: [],
        references: [{ chapterId: 1, from: 1, to: 1 }],
      };
      const serverClient = createServerClient({
        clientId: "client-id",
        clientSecret: "client-secret",
      });
      const publicClient = createPublicClient({
        clientId: "client-id",
        clientType: "confidential-proxy",
      });

      void serverClient.quranReflect.v1.posts.create(payload).then(
        (response: QuranReflectPostMutationResponse) => response.data?.id,
      );
      void publicClient.quranReflect.v1.posts.create(payload);
      void serverClient.quranReflect.v1.posts.create({
        body: {
          post: payload,
        },
      });
      void serverClient.quranReflect.v1.posts.update(123, {
        body: "Updated reflection",
      });
      void serverClient.quranReflect.v1.posts.get(123);

      const invalidPayload: CreateQuranReflectPostPayload = {
        body: "Invalid reflection",
        draft: false,
        mentions: [],
        references: [
          // @ts-expect-error - chapterId must be numeric.
          { chapterId: "1", from: 1, to: 1 },
        ],
      };

      void invalidPayload;
    `;
    const options: ts.CompilerOptions = {
      baseUrl: process.cwd(),
      esModuleInterop: true,
      lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      noEmit: true,
      paths: {
        "@/*": ["src/*"],
        "@quranjs/api": ["src/index.ts"],
        "@quranjs/api/public": ["src/public.ts"],
        "@quranjs/api/server": ["src/server.ts"],
      },
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
    };

    const baseHost = ts.createCompilerHost(options);
    const normalize = (filePath: string) =>
      path.resolve(filePath).toLowerCase();
    const normalizedSourceFile = normalize(sourceFile);
    const compilerHost: ts.CompilerHost = {
      ...baseHost,
      fileExists: (filePath) =>
        normalize(filePath) === normalizedSourceFile ||
        baseHost.fileExists(filePath),
      getSourceFile: (filePath, languageVersion, onError, shouldCreateNewFile) =>
        normalize(filePath) === normalizedSourceFile
          ? ts.createSourceFile(filePath, source, languageVersion, true)
          : baseHost.getSourceFile(
              filePath,
              languageVersion,
              onError,
              shouldCreateNewFile,
            ),
      readFile: (filePath) =>
        normalize(filePath) === normalizedSourceFile
          ? source
          : baseHost.readFile(filePath),
    };

    const program = ts.createProgram([sourceFile], options, compilerHost);
    expect(formatDiagnostics(ts.getPreEmitDiagnostics(program))).toBe("");
  }, 15_000);
});
