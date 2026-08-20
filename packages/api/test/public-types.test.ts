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

describe("@quranjs/api/public type surface", () => {
  it("exports public session and content sync types", () => {
    const sourceFile = path.join(
      process.cwd(),
      "test",
      "__public-entrypoint-types.ts",
    );
    const source = `
      import type { PublicClient, TokenStorage, UserSession } from "@quranjs/api/public";
      import type {
        ContentSyncResourceGroup,
        WordByWordTranslationSnapshotRecord,
      } from "@quranjs/api";

      const storage: TokenStorage = {
        getSession: async (): Promise<UserSession | null> => ({
          accessToken: "access-token",
        }),
        setSession: async (_session: UserSession | null) => undefined,
        clearSession: async () => undefined,
      };
      const client: PublicClient | null = null;
      const resourceGroup: ContentSyncResourceGroup = "word_by_word_translations";
      const record: WordByWordTranslationSnapshotRecord = {
        id: 1,
        resourceContentId: 85,
        resourceId: 85,
        wordId: 1,
        languageId: 38,
        languageName: "english",
        text: "In",
        priority: 1,
        updatedAt: "2026-08-19T02:43:00Z",
      };
      const genericRecord: Record<string, unknown> = record;
      const nullableRecord: WordByWordTranslationSnapshotRecord = {
        ...record,
        languageName: null,
        text: null,
        priority: null,
      };

      void storage;
      void client;
      void resourceGroup;
      void genericRecord;
      void nullableRecord;
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
      getSourceFile: (
        filePath,
        languageVersion,
        onError,
        shouldCreateNewFile,
      ) =>
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
