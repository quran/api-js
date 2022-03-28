const alias = require('@rollup/plugin-alias');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const buble = require('rollup-plugin-buble');
const sizes = require('rollup-plugin-sizes');
const path = require('path');

const customResolver = resolve({
  extensions: ['.mjs', '.js', '.json', '.ts'],
});
const projectRootDir = path.resolve(__dirname);

const plugins = [
  alias({
    entries: [{ find: '@', replacement: path.resolve(projectRootDir, 'src') }],
    customResolver,
  }),
  resolve(),
  buble(),
  sizes(),
];

module.exports = {
  rollup(config, options) {
    plugins.forEach((plugin) => {
      config.plugins.push(plugin);
    });
    return config;
  },
};
