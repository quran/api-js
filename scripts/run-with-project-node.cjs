#!/usr/bin/env node

const { spawnSync } = require("node:child_process");

if (process.argv.length < 3) {
  process.stderr.write(
    "Usage: node ./scripts/run-with-project-node.cjs <command> [args...]\n",
  );
  process.exit(1);
}

const useShell = process.platform === "win32";
const [command, ...args] = process.argv.slice(2);

spawnSync("corepack", ["enable"], {
  shell: useShell,
  stdio: "ignore",
});

const result = spawnSync(command, args, {
  env: process.env,
  shell: useShell,
  stdio: "inherit",
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 0);
