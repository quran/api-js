const alias = require('@rollup/plugin-alias');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const analyze = require('rollup-plugin-analyzer');
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
  analyze(),
];

module.exports = {
  rollup(config, options) {
    plugins.forEach((plugin) => {
      config.plugins.push(plugin);
    });
    return config;
  },
};
