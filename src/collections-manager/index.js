// dev/src/collections-manager/index.js
const fs = require('fs').promises;
const fss = require('fs'); // For synchronous checks like existsSync
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const fsExtra = require('fs-extra'); // fsExtra is used by some commands
const chalk = require('chalk');
const yaml = require('js-yaml');

// Utilities and Constants
const { deriveCollectionName } = require('./cm-utils'); // Assuming cm-utils.js is present
const {
  METADATA_FILENAME,
  ENABLED_MANIFEST_FILENAME,
  DEFAULT_ARCHETYPE_BASE_DIR_NAME,
} = require('./constants');

// Command Modules
const addCollectionCmd = require('./commands/add');
const enablePluginCmd = require('./commands/enable');
const enableAllPluginsInCollectionCmd = require('./commands/enableAll');
const disablePluginCmd = require('./commands/disable');
const removeCollectionCmd = require('./commands/remove');
const updateCollectionCmd = require('./commands/update');
const updateAllCollectionsCmd = require('./commands/updateAll');
const listAvailablePluginsCmd = require('./commands/listAvailable');
const listCollectionsCmd = require('./commands/list');
const archetypePluginCmd = require('./commands/archetype');

class CollectionsManager {
  constructor(options = {}) {
    this.collRoot = options.collRoot || this.determineCollRoot();
    this.debug = options.debug || false;
    if (this.debug) {
      console.log(chalk.magenta(`DEBUG (CollectionsManager): Initialized. COLL_ROOT: ${this.collRoot}`));
    }

    // Bind command methods from external files
    this.addCollection = addCollectionCmd.bind(this);
    this.enablePlugin = enablePluginCmd.bind(this);
    this.enableAllPluginsInCollection = enableAllPluginsInCollectionCmd.bind(this);
    this.disablePlugin = disablePluginCmd.bind(this);
    this.removeCollection = removeCollectionCmd.bind(this);
    this.updateCollection = updateCollectionCmd.bind(this);
    this.updateAllCollections = updateAllCollectionsCmd.bind(this);
    this.listAvailablePlugins = listAvailablePluginsCmd.bind(this);
    this.listCollections = listCollectionsCmd.bind(this);
    this.archetypePlugin = archetypePluginCmd.bind(this);
  }

  determineCollRoot() {
    const xdgDataHome = process.env.XDG_DATA_HOME ||
      (os.platform() === 'win32'
        ? path.join(os.homedir(), 'AppData', 'Local')
        : path.join(os.homedir(), '.local', 'share'));
    return path.join(xdgDataHome, 'md-to-pdf', 'collections');
  }

  async _readEnabledManifest() {
    const enabledManifestPath = path.join(this.collRoot, ENABLED_MANIFEST_FILENAME);
    let enabledManifest = { enabled_plugins: [] };
    try {
      if (fss.existsSync(enabledManifestPath)) {
        const manifestContent = await fs.readFile(enabledManifestPath, 'utf8');
        const loadedData = yaml.load(manifestContent);
        if (loadedData && Array.isArray(loadedData.enabled_plugins)) {
          enabledManifest = loadedData;
        } else {
          if (this.debug && loadedData) console.warn(chalk.yellow(`WARN (CM:_readEnabledManifest): Invalid structure in ${ENABLED_MANIFEST_FILENAME}. Re-initializing.`));
        }
      } else {
        if (this.debug) console.log(chalk.magenta(`DEBUG (CM:_readEnabledManifest): ${ENABLED_MANIFEST_FILENAME} not found. Initializing new one.`));
      }
    } catch (e) {
      console.warn(chalk.yellow(`WARN (CM:_readEnabledManifest): Could not read or parse ${enabledManifestPath}: ${e.message}. Starting with a new manifest.`));
    }
    return enabledManifest;
  }

  async _writeEnabledManifest(manifestData) {
    const enabledManifestPath = path.join(this.collRoot, ENABLED_MANIFEST_FILENAME);
    try {
      await fs.mkdir(this.collRoot, { recursive: true });
      const yamlString = yaml.dump(manifestData, { sortKeys: true });
      await fs.writeFile(enabledManifestPath, yamlString);
      if (this.debug) console.log(chalk.magenta(`DEBUG (CM:_writeEnabledManifest): Successfully wrote to ${enabledManifestPath}`));
    } catch (e) {
      console.error(chalk.red(`ERROR (CM:_writeEnabledManifest): Failed to write to ${enabledManifestPath}: ${e.message}`));
      throw e;
    }
  }

  async _readCollectionMetadata(collectionName) {
    const collectionPath = path.join(this.collRoot, collectionName);
    const metadataPath = path.join(collectionPath, METADATA_FILENAME);
    if (!fss.existsSync(metadataPath)) {
      if (this.debug) console.log(chalk.magenta(`DEBUG (CM:_readCollMeta): Metadata file not found for ${collectionName} at ${metadataPath}`));
      return null;
    }
    try {
      const metaContent = await fs.readFile(metadataPath, 'utf8');
      return yaml.load(metaContent);
    } catch (e) {
      console.error(chalk.red(`ERROR (CM:_readCollMeta): Could not read or parse metadata for "${collectionName}": ${e.message}`));
      throw e;
    }
  }

  async _writeCollectionMetadata(collectionName, metadataContent) {
    const collectionPath = path.join(this.collRoot, collectionName);
    const metadataPath = path.join(collectionPath, METADATA_FILENAME);
    try {
      await fs.mkdir(collectionPath, { recursive: true });
      const yamlString = yaml.dump(metadataContent);
      await fs.writeFile(metadataPath, yamlString);
      if (this.debug) console.log(chalk.magenta(`DEBUG (CM:_writeCollMeta): Wrote metadata to ${metadataPath}`));
    } catch (metaError) {
      console.warn(chalk.yellow(`WARN (CM:_writeCollMeta): Could not write collection metadata for ${collectionName}: ${metaError.message}`));
      throw metaError;
    }
  }

  _spawnGitProcess(gitArgs, cwd, operationDescription) {
    return new Promise((resolve, reject) => {
      if (this.debug) console.log(chalk.magenta(`DEBUG (CM:_spawnGit): Spawning git with args: [${gitArgs.join(' ')}] in ${cwd} for ${operationDescription}`));
      const gitProcess = spawn('git', gitArgs, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      gitProcess.stdout.on('data', (data) => {
        const dataStr = data.toString();
        if (!(gitArgs.includes('status') && gitArgs.includes('--porcelain')) &&
            !(gitArgs.includes('rev-list') && gitArgs.includes('--count')) ||
            this.debug) {
            process.stdout.write(chalk.gray(`  GIT (${operationDescription}): ${dataStr}`));
        }
        stdout += dataStr;
      });
      gitProcess.stderr.on('data', (data) => {
        const dataStr = data.toString();
        process.stderr.write(chalk.yellowBright(`  GIT (${operationDescription}, stderr): ${dataStr}`));
        stderr += dataStr;
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, code, stdout, stderr });
        } else {
          console.error(chalk.red(`\n  ERROR: Git operation '${gitArgs.join(' ')}' for ${operationDescription} failed with exit code ${code}.`));
          const error = new Error(`Git ${gitArgs.join(' ')} failed for ${operationDescription} with exit code ${code}.`);
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        }
      });
      gitProcess.on('error', (err) => {
        console.error(chalk.red(`\n  ERROR: Failed to start git process for ${operationDescription}: ${err.message}`));
        reject(err);
      });
    });
  }
}

module.exports = CollectionsManager;
