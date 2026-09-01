const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const distPath = path.resolve(__dirname, "../../dist");

const loadEntrypoints = async () => {
  const cjs = ["index.min.js", "public.min.js", "server.min.js"].map((file) =>
    require(path.join(distPath, file)),
  );
  const esm = await Promise.all(
    ["index.min.mjs", "public.min.mjs", "server.min.mjs"].map(
      (file) => import(pathToFileURL(path.join(distPath, file)).href),
    ),
  );
  return [...cjs, ...esm];
};

const main = async () => {
  const entrypoints = await loadEntrypoints();
  const [first, ...rest] = entrypoints;

  for (const entrypoint of rest) {
    assert.strictEqual(entrypoint.QuranHttpError, first.QuranHttpError);
  }

  for (const entrypoint of entrypoints) {
    const error = await entrypoint.QuranHttpError.fromResponse(
      Response.json(
        {
          details: { error: "bootstrap_required" },
          message: "Bootstrap is required to recover App State.",
          success: false,
          type: "gone",
        },
        { status: 410, statusText: "Gone" },
      ),
    );
    for (const observableEntrypoint of entrypoints) {
      assert.ok(error instanceof observableEntrypoint.QuranHttpError);
    }
  }

  process.stdout.write("App State package smoke passed for 6 entrypoints.\n");
};

main().catch(() => {
  process.stderr.write("App State package smoke failed.\n");
  process.exitCode = 1;
});
