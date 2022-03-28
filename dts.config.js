const analyze = require('rollup-plugin-analyzer');

const plugins = [analyze()];

module.exports = {
  rollup(config, options) {
    plugins.forEach((plugin) => {
      config.plugins.push(plugin);
    });
    return config;
  },
};
