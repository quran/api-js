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
        MushafFontAssetSnapshotRecord,
        MushafMetadataSnapshotRecord,
        MushafPageSnapshotRecord,
        MushafSnapshotRecord,
        MushafWordSnapshotRecord,
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
      const mushafResourceGroup: ContentSyncResourceGroup = "mushafs";
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
      const mushafMetadata: MushafMetadataSnapshotRecord = {
        recordType: "mushaf",
        id: 1,
        resourceContentId: 382,
        name: "QCF V2",
        description: null,
        pagesCount: 604,
        linesPerPage: 15,
        defaultFontName: "v2",
        mappingMode: "reference",
        qirat: { id: 1, name: "Hafs" },
      };
      const mushafPage: MushafPageSnapshotRecord = {
        recordType: "mushaf_page",
        id: 10,
        mushafId: 1,
        pageNumber: 1,
        firstVerseId: 1,
        lastVerseId: 7,
        firstWordId: 1,
        lastWordId: 29,
        versesCount: 7,
        verseMapping: { "1": "1:1" },
        updatedAt: "2026-08-19T02:43:00Z",
      };
      const fontAsset: MushafFontAssetSnapshotRecord = {
        recordType: "font_asset",
        id: 20,
        assetKey: "page-001",
        mushafId: 1,
        pageNumber: 1,
        fontFamily: "QCF_P001",
        format: "woff2",
        mimeType: "font/woff2",
        url: "https://verses.quran.foundation/fonts/qcf-v2/p1.woff2",
        sha256:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        byteSize: 1234,
        version: "1",
        provider: "Quran Foundation",
        licenseName: "Quran Foundation Font License",
        licenseUrl: null,
        attribution: null,
        updatedAt: "2026-08-19T02:43:00Z",
      };
      const mushafWord: MushafWordSnapshotRecord = {
        recordType: "mushaf_word",
        id: 30,
        mushafId: 1,
        wordId: 1,
        verseId: 1,
        sourceVerseId: 1,
        text: "ﱁ",
        charTypeId: 1,
        charTypeName: "word",
        pageNumber: 1,
        lineNumber: 1,
        positionInVerse: 1,
        positionInLine: 1,
        positionInPage: 1,
        cssClass: null,
        cssStyle: null,
      };
      const mushafRecords: MushafSnapshotRecord[] = [
        mushafMetadata,
        mushafPage,
        fontAsset,
        mushafWord,
      ];

      void storage;
      void client;
      void resourceGroup;
      void mushafResourceGroup;
      void genericRecord;
      void nullableRecord;
      void mushafRecords;
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
