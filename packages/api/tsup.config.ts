import type { Options } from "tsup";
import { defineConfig } from "tsup";

const baseConfig: Options = {
  entry: ["src/index.ts"],
  outDir: "dist",
  outExtension({ format, options }) {
    const ext = format === "esm" ? "mjs" : "js";
    const finalFormat = format === "cjs" || format === "esm" ? "" : format;

    const outputExtension = options.minify
      ? `${finalFormat}.min.${ext}`
      : `${finalFormat}.${ext}`;

    return {
      js: outputExtension.startsWith(".")
        ? outputExtension
        : `.${outputExtension}`,
    };
  },
  treeshake: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
};

export default defineConfig((options) => [
  {
    ...baseConfig,
    format: ["cjs", "esm"],
    minify: !options.watch,
  },
]);
