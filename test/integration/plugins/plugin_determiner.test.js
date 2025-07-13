// test/integration/plugins/plugin_determiner.test.js

const { pluginDeterminerPath } = require('@paths');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const { logs, clearLogs } = require('../../shared/capture-logs');
const testManifest = require('./plugin_determiner.manifest');
const path = require('path');

// Use capture-logs.js as the logger module for loggerPath
const testLoggerPath = path.resolve(__dirname, '../../shared/capture-logs.js');

describe('determinePluginToUse (Module Integration Tests)', function() {
  let determinePluginToUse;
  let mockFsPromises;
  let mockFsSync;
  let mockPath;
  let mockYaml;
  let mockMarkdownUtils;
  let mockProcessCwd;
  let dependencies;
  let originalPathsModule;

  const commonTestConstants = {
    DUMMY_MARKDOWN_FILE_PATH: '/test/path/to/my-document.md',
    DUMMY_LOCAL_CONFIG_FILE_PATH: '/test/path/to/my-document.config.yaml',
    DUMMY_MARKDOWN_FILENAME: 'my-document.md',
  };

  beforeEach(function() {
    clearLogs();

    const pathsPath = require.resolve('@paths');
    originalPathsModule = require.cache[pathsPath];
    delete require.cache[pluginDeterminerPath];
    delete require.cache[pathsPath];

    require.cache[pathsPath] = {
      exports: {
        ...require(pathsPath),
        loggerPath: testLoggerPath
      }
    };

    mockFsPromises = { readFile: sinon.stub(), };
    mockFsSync = { existsSync: sinon.stub().returns(false), statSync: sinon.stub(), };

    mockPath = {
      resolve: sinon.stub().callsFake((...args) => require('path').resolve(...args)),
      dirname: require('path').dirname,
      basename: require('path').basename,
      extname: require('path').extname,
      join: require('path').join,
    };

    mockYaml = { load: sinon.stub(), };
    mockMarkdownUtils = { extractFrontMatter: sinon.stub(), };

    mockProcessCwd = sinon.stub(process, 'cwd').callThrough();

    dependencies = {
      fsPromises: mockFsPromises, fsSync: mockFsSync, path: mockPath,
      yaml: mockYaml, markdownUtils: mockMarkdownUtils, processCwd: mockProcessCwd,
    };

    determinePluginToUse = require(pluginDeterminerPath).determinePluginToUse;
  });

  afterEach(function() {
    if (originalPathsModule) {
      require.cache[require.resolve('@paths')] = originalPathsModule;
    }
    sinon.restore();
    delete process.env.DEBUG_PLUGIN_DETERMINER;
  });

  testManifest.forEach(testCase => {
    const it_ = testCase.only ? it.only : testCase.skip ? it.skip : it;

    it_(`${testCase.describe}`, async function() {
      const currentMocks = {
        mockFsPromises, mockFsSync, mockPath, mockYaml, mockMarkdownUtils, mockProcessCwd,
      };

      if (testCase.setup) {
        await testCase.setup(testCase.args, currentMocks, commonTestConstants);
      }

      const result = await determinePluginToUse(testCase.args, dependencies, testCase.defaultPluginName || 'default');

      await testCase.assert(result, testCase.args, currentMocks, commonTestConstants, expect, logs);
    });
  });
});

