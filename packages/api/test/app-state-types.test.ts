import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const diagnosticsText = (diagnostics: readonly ts.Diagnostic[]): string =>
  diagnostics
    .map((diagnostic) =>
      ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    )
    .join("\n");

describe("App State type surface", () => {
  it("types both clients and rejects conflicting preconditions", () => {
    const sourceFile = path.join(process.cwd(), "test", "__app-state-types.ts");
    const source = `
      import { createPublicClient } from "@quranjs/api/public";
      import { createServerClient } from "@quranjs/api/server";
      import { isAppStateHttpError } from "@quranjs/api";
      import type { AppStateTransport } from "@quranjs/api";

      const server = createServerClient({
        clientId: "client-id",
        clientSecret: "client-secret",
      });
      const publicClient = createPublicClient({
        clientId: "client-id",
        clientType: "confidential-proxy",
      });

      const serverTransport: AppStateTransport = server.auth.v1.appState;
      const publicTransport: AppStateTransport = publicClient.auth.appState;
      void serverTransport.getConfiguration();
      void publicTransport.bootstrap();

      const inspectError = (error: unknown) => {
        if (isAppStateHttpError(error, "precondition_failed")) {
          const currentETag: string | null | undefined =
            error.payload.details.currentETag;
          void currentETag;
        }
      };
      void inspectError;

      void server.auth.v1.appState.getChanges("opaque", { limit: 10 });
      void publicClient.auth.appState.putDocument(
        "settings",
        "theme",
        { value: { font_size: 18 }, schemaVersion: 1 },
        { idempotencyKey: "idempotency-key-0001", ifMatch: '"opaque"' },
      );
      void publicClient.auth.appState.putDocument(
        "settings",
        "theme",
        { value: null, schemaVersion: 1 },
        // @ts-expect-error - only one precondition header may be sent.
        {
          idempotencyKey: "idempotency-key-0002",
          ifMatch: '"opaque"',
          ifNoneMatch: "*",
        },
      );
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
    expect(diagnosticsText(ts.getPreEmitDiagnostics(program))).toBe("");
  }, 15_000);
});
