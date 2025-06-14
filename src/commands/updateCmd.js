// src/commands/updateCmd.js
const chalk = require('chalk');

module.exports = {
  command: ['update [<collection_name>]', 'up [<collection_name>]'],
  describe: 'Updates a Git-based plugin collection(s). (Shortcut for "collection update")',
  builder: (yargsCmd) => {
    yargsCmd
      .positional('collection_name', {
        describe: 'Optional. The name of the specific collection to update. If omitted, updates all Git-based collections.',
        type: 'string',
      })
      .epilogue(`This command provides a convenient shortcut for "md-to-pdf collection update".
It fetches updates from the collection's remote Git source.
Local modifications in the collection directory may be overwritten.
This command only syncs the collection files; it does not automatically enable any new plugins that might be added to the remote source.`);
  },
  handler: async (args) => {
    if (!args.manager) {
      console.error(chalk.red("FATAL ERROR: CollectionsManager instance not found in CLI arguments. This is an internal setup issue."));
      process.exit(1);
      return;
    }
    const manager = args.manager;

    if (args.collection_name) {
      console.log(chalk.blue(`Attempting to update collection '${chalk.cyan(args.collection_name)}' (via md-to-pdf ${args.$0})...`));
      try {
        const result = await manager.updateCollection(args.collection_name);
        // The manager.updateCollection method is expected to provide detailed console output.
        if (result && !result.success) {
           console.warn(chalk.yellow(`Update for '${args.collection_name}' may have had issues: ${result.message || 'Please check output above.'}`));
        }
      } catch (error) {
        console.error(chalk.red(`\nERROR updating collection '${args.collection_name}': ${error.message}`));
        if (process.env.DEBUG_CM === 'true' && error.stack) {
          console.error(chalk.red(error.stack));
        }
        process.exit(1); // Exit on error to ensure scriptability
      }
    } else {
      console.log(chalk.blue(`Attempting to update all Git-based collections (via md-to-pdf ${args.$0})...`));
      try {
        const results = await manager.updateAllCollections();
        // The manager.updateAllCollections method is expected to provide detailed console output.
        if (results && !results.success) {
            console.warn(chalk.yellow("\nSome collections may not have updated successfully or were skipped. Please check output above."));
        } else if (results && results.success && results.messages && results.messages.length === 0) {
            // This case might occur if there are no collections to update.
            // manager.updateAllCollections should ideally print something like "No collections found to update."
            // For now, we assume its output is sufficient.
        }
      } catch (error) {
        console.error(chalk.red(`\nERROR updating all collections: ${error.message}`));
        if (process.env.DEBUG_CM === 'true' && error.stack) {
          console.error(chalk.red(error.stack));
        }
        process.exit(1); // Exit on error
      }
    }
  }
};
