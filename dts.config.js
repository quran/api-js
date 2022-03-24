const alias = require('@rollup/plugin-alias');
const resolve = require('@rollup/plugin-node-resolve').nodeResolve;
const path = require('path');

const customResolver = resolve({
  extensions: ['.mjs', '.js', '.json', '.ts'],
});
const projectRootDir = path.resolve(__dirname);

module.exports = {
  rollup(config, options) {
    config.plugins.push(
      alias({
        entries: [
          { find: '@', replacement: path.resolve(projectRootDir, 'src') },
        ],
        customResolver,
      })
    );
    config.plugins.push(resolve());
    return config;
  },
};
