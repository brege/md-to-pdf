// src/cli/commands/collection/add.command.js
const { loggerPath, cliPath } = require('@paths');
const { execSync } = require('child_process');

const logger = require(loggerPath);

module.exports = {
  command: 'add <url_or_path>',
  describe: 'add a new plugin collection by URL or path',
  builder: (yargsCmd) => {
    yargsCmd
      .positional('url_or_path', {
        describe: 'source URL or local path of the collection',
        type: 'string',
        demandOption: true,
      })
      .option('name', {
        alias: 'n',
        describe: 'set a custom name for the collection',
        type: 'string'
      });
  },
  handler: async (args) => {
    if (!args.manager) {
      logger.fatal('FATAL ERROR: CollectionsManager instance not found in CLI arguments.');
      process.exit(1);
    }
    const manager = args.manager;

    try {
      await manager.addCollection(args.url_or_path, { name: args.name });
      try {
        execSync(`node "${cliPath}" _tab_cache`);
      } catch {
        logger.warn('WARN: Failed to regenerate completion cache. This is not a fatal error.');
      }
    } catch (error) {
      logger.error(`\nERROR in 'md-to-pdf collection add' command execution: ${error.message}`);
      process.exit(1);
    }
  }
};
