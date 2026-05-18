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
  it("exports public session storage types", () => {
    const sourceFile = path.join(
      process.cwd(),
      "test",
      "__public-entrypoint-types.ts",
    );
    const source = `
      import type { PublicClient, TokenStorage, UserSession } from "@quranjs/api/public";

      const storage: TokenStorage = {
        getSession: async (): Promise<UserSession | null> => ({
          accessToken: "access-token",
        }),
        setSession: async (_session: UserSession | null) => undefined,
        clearSession: async () => undefined,
      };
      const client: PublicClient | null = null;

      void storage;
      void client;
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
  });
});
