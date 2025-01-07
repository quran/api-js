import { defineConfig } from 'tsup';

export default defineConfig((options) => [
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    treeshake: true,
    minify: !options.watch,
  },
  {
    // Configuration for CDNs
    entry: ['src/index.ts'],
    format: 'iife', // For CDNs (IIFE format for browsers)
    globalName: 'quran', // Global variable for browser use
    outDir: 'dist/umd',
    splitting: false,
    sourcemap: false,
    clean: true,
    dts: true,
    treeshake: true,
    minify: !options.watch,
  },
]);
