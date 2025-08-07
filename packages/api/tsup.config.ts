import { defineConfig, Format, type Options } from 'tsup';
import { createUmdWrapper } from './umd-wrapper-plugin';
import { dependencies, version } from './package.json';

const externalDependencies = Object.keys(dependencies);

const clientName = 'quranjsApi';
const clientVersion = version;

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
]);
