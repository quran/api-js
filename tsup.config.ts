import { defineConfig, Format, type Options } from 'tsup';
import { createUmdWrapper } from './umd-wrapper-plugin.mjs';
import { dependencies } from './package.json';

const externalDependencies = Object.keys(dependencies);

const clientName = 'quranjsApi';
const clientVersion = `{{VERSION_TO_REPLACE}}`;

const baseConfig: Options = {
  entry: ['src/index.ts'],
  outDir: 'dist',
  outExtension({ format, options }) {
    const ext = format === 'esm' ? 'mjs' : 'js';
    const finalFormat = format === 'cjs' || format === 'esm' ? '' : format;

    const outputExtension = options.minify
      ? `${finalFormat}.min.${ext}`
      : `${finalFormat}.${ext}`;

    return {
      js: outputExtension.startsWith('.')
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

const umdConfig: Options = {
  ...baseConfig,
  platform: 'browser',
  target: ['chrome90', 'edge90', 'firefox90', 'opera98', 'safari15'],
  format: ['umd' as Format],
  noExternal: externalDependencies,
  banner: { js: `/* @QuranJS/API version ${clientVersion} */\n` },
  define: {
    __VERSION__: `'${clientVersion}'`,
  },
  name: '@quranjs/api',
  globalName: clientName,
  bundle: true,
  esbuildPlugins: [],
};

// export default defineConfig((options) => [
//   {
//     entry: ['src/index.ts'],
//     format: ['esm', 'cjs'],
//     splitting: false,
//     sourcemap: true,
//     clean: true,
//     dts: true,
//     treeshake: true,
//     minify: !options.watch,
//   },
//   {
//     // Configuration for CDNs
//     entry: ['src/index.ts'],
//     format: 'iife', // For CDNs (IIFE format for browsers)
//     globalName: 'quran', // Global variable for browser use
//     outDir: 'dist/umd',
//     splitting: false,
//     sourcemap: false,
//     clean: true,
//     dts: true,
//     treeshake: true,
//     minify: !options.watch,
//   },
// ]);

export default defineConfig((options) => [
  {
    ...baseConfig,
    format: ['cjs', 'esm'],
    minify: !options.watch,
  },
  {
    ...umdConfig,
    minify: false,
    plugins: [createUmdWrapper({ libraryName: clientName, external: [] })],
  },
  {
    ...umdConfig,
    minify: true,
    plugins: [createUmdWrapper({ libraryName: clientName, external: [] })],
  },
  // {
  //   ...umdConfig,
  //   minify: false,
  //   target: 'es5',
  //   outputExtension: {
  //     js: `browser.js`,
  //   },
  //   esbuildPlugins: [
  //     umdWrapper({ libraryName: clientName, external: 'inherit' }),
  //   ],
  // },
]);
