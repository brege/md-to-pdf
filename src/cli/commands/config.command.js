// src/cli/commands/config.command.js
const { configDisplayPath } = require('@paths');
const { displayConfig } = require(configDisplayPath);

module.exports = {
  command: 'config',
  describe: 'display active configuration settings',
  builder: (yargs) => {
    yargs
      .option('plugin', {
        alias: 'p',
        describe: 'display the effective configuration for a plugin',
        type: 'string',
        completionKey: 'usablePlugins'
      })
      .option('pure', {
        describe: 'output raw configuration data (for piping)',
        type: 'boolean',
        default: false
      });
  },
  handler: async (args) => {
    args.isLazyLoad = false;
    await displayConfig(args);
  }
};
