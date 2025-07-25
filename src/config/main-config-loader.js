// src/config/main-config-loader.js
const os = require('os');
const {
  defaultConfigPath,
  factoryDefaultConfigPath,
  configUtilsPath,
  loggerPath
} = require('@paths');

const logger = require(loggerPath);
class MainConfigLoader {
  constructor(projectRoot, mainConfigPathFromCli, useFactoryDefaultsOnly = false, xdgBaseDir = null, dependencies = {}) {
    this.fs = dependencies.fs || require('fs');
    this.path = dependencies.path || require('path');
    this.process = dependencies.process || process;
    this.loadYamlConfig = dependencies.loadYamlConfig || require(configUtilsPath).loadYamlConfig;

    this.projectRoot = projectRoot;
    this.defaultMainConfigPath = defaultConfigPath;
    this.factoryDefaultMainConfigPath = factoryDefaultConfigPath;

    this.xdgBaseDir = xdgBaseDir || this.path.join(this.process.env.XDG_CONFIG_HOME || this.path.join(os.homedir(), '.config'), 'md-to-pdf');
    this.xdgGlobalConfigPath = this.path.join(this.xdgBaseDir, 'config.yaml');

    this.projectManifestConfigPath = mainConfigPathFromCli;
    this.useFactoryDefaultsOnly = useFactoryDefaultsOnly;

    this.primaryConfig = null;
    this.primaryConfigPath = null;
    this.primaryConfigLoadReason = null;
    this.xdgConfigContents = null;
    this.projectConfigContents = null;
    this._initialized = false;
  }

  async _initialize() {
    if (this._initialized) return;

    let configPathToLoad;
    let loadedFromReason = '';

    if (this.useFactoryDefaultsOnly) {
      configPathToLoad = this.factoryDefaultMainConfigPath;
      loadedFromReason = 'factory default';
    } else if (this.projectManifestConfigPath && this.fs.existsSync(this.projectManifestConfigPath)) {
      configPathToLoad = this.projectManifestConfigPath;
      loadedFromReason = 'project (from --config)';
    } else if (this.fs.existsSync(this.xdgGlobalConfigPath)) {
      configPathToLoad = this.xdgGlobalConfigPath;
      loadedFromReason = 'XDG global';
    } else {
      if (this.fs.existsSync(this.defaultMainConfigPath)) {
        configPathToLoad = this.defaultMainConfigPath;
        loadedFromReason = 'bundled main';
      } else {
        configPathToLoad = this.factoryDefaultMainConfigPath;
        loadedFromReason = 'factory default fallback';
      }
    }
    this.primaryConfigLoadReason = loadedFromReason;

    this.primaryConfigPath = configPathToLoad;

    if (configPathToLoad && this.fs.existsSync(configPathToLoad)) {
      try {
        this.primaryConfig = await this.loadYamlConfig(configPathToLoad);
      } catch (error) {
        logger.error(`ERROR (MainConfigLoader): loading primary main configuration from '${configPathToLoad}': ${error.message}`);
        this.primaryConfig = {};
      }
    } else {
      this.primaryConfig = {};
      this.primaryConfigLoadReason = 'none found';
      this.primaryConfigPath = null;
      logger.warn('WARN (MainConfigLoader): Primary main configuration file could not be identified or loaded. Using empty global settings.');
    }
    this.primaryConfig = this.primaryConfig || {};

    if (!this.useFactoryDefaultsOnly) {
      if (this.fs.existsSync(this.xdgGlobalConfigPath)) {
        try {
          if (this.xdgGlobalConfigPath === this.primaryConfigPath) {
            this.xdgConfigContents = this.primaryConfig;
          } else {
            this.xdgConfigContents = await this.loadYamlConfig(this.xdgGlobalConfigPath);
          }
        } catch (e) {
          logger.warn(`WARN (MainConfigLoader): Could not load XDG main config from ${this.xdgGlobalConfigPath}: ${e.message}`);
          this.xdgConfigContents = {};
        }
      } else {
        this.xdgConfigContents = {};
      }

      if (this.projectManifestConfigPath && this.fs.existsSync(this.projectManifestConfigPath)) {
        try {
          if (this.projectManifestConfigPath === this.primaryConfigPath) {
            this.projectConfigContents = this.primaryConfig;
          } else {
            this.projectConfigContents = await this.loadYamlConfig(this.projectManifestConfigPath);
          }
        } catch (e) {
          logger.warn(`WARN (MainConfigLoader): Could not load project manifest from ${this.projectManifestConfigPath}: ${e.message}`);
          this.projectConfigContents = {};
        }
      } else if (this.projectManifestConfigPath) {
        logger.warn(`WARN (MainConfigLoader): Project manifest config path provided but file does not exist: ${this.projectManifestConfigPath}`);
        this.projectConfigContents = {};
      }
      else {
        this.projectConfigContents = null;
      }
    } else {
      this.xdgConfigContents = {};
      this.projectConfigContents = null;
    }
    this.xdgConfigContents = this.xdgConfigContents || {};
    this.projectConfigContents = this.projectConfigContents || {};

    this._initialized = true;
  }

  async getPrimaryMainConfig() {
    await this._initialize();
    return {
      config: {
        ...this.primaryConfig,
        projectRoot: this.projectRoot
      },
      path: this.primaryConfigPath,
      baseDir: this.primaryConfigPath ? this.path.dirname(this.primaryConfigPath) : null,
      reason: this.primaryConfigLoadReason
    };
  }

  async getXdgMainConfig() {
    await this._initialize();
    const xdgBase = this.xdgGlobalConfigPath ? this.path.dirname(this.xdgGlobalConfigPath) : this.xdgBaseDir;
    return {
      config: {
        ...this.xdgConfigContents,
        projectRoot: this.projectRoot
      },
      path: this.xdgGlobalConfigPath,
      baseDir: xdgBase
    };
  }

  async getProjectManifestConfig() {
    await this._initialize();
    return {
      config: {
        ...(this.projectConfigContents || {}),
        projectRoot: this.projectRoot
      },
      path: this.projectManifestConfigPath,
      baseDir: this.projectManifestConfigPath && this.fs.existsSync(this.projectManifestConfigPath) ? this.path.dirname(this.projectManifestConfigPath) : null
    };
  }
}

module.exports = MainConfigLoader;
