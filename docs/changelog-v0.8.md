# Changelog - md-to-pdf v0.8.x Series

* For the v0.7.x changelog, see [changelog-v0.7.md](changelog-v0.7.md).
* For the development track *before* v0.7.0, see [roadmap.md](roadmap.md).


## v0.8.1 (Conceptual - Integrate CollectionsManager Manifest)

**Date:** May 30, 2025

### Added
* **CollectionsManager Integration**: `PluginRegistryBuilder.js` now reads the `enabled.yaml` manifest file generated by `md-to-pdf-cm`.
    * Plugins enabled via `md-to-pdf-cm enable ...` are automatically discovered and made available to `md-to-pdf`.
    * This streamlines the workflow, as users no longer need to manually register CM-enabled plugins in a main `config.yaml` file.

### Changed
* **Plugin Registration Precedence**: The order of precedence for plugin registration sources has been updated to include plugins from the CollectionsManager manifest. The new order (highest to lowest) is:
    1.  Project `config.yaml` (`plugins:` section)
    2.  XDG `config.yaml` (`plugins:` section)
    3.  CollectionsManager `enabled.yaml` manifest
    4.  Bundled `config.example.yaml` (`plugins:` section - factory defaults)
* The `md-to-pdf plugin list` command now correctly displays plugins loaded from the CollectionsManager manifest, respecting this precedence.

### Note on Testing
* Direct unit tests for the `enabled.yaml` integration within the main `md-to-pdf` test suite (Task 3.4 from `docs-devel/proposal-v0.8.1.md`) have been deferred.

* **Reason for Deferral**

  Implementing isolated and reliable test cases for this specific integration presents challenges within the current main project's testing framework, particularly concerning the mocking or management of the `enabled.yaml` file and its XDG-based location from within `dev/test/run-tests.js`. The functionality has been manually verified. Future enhancements to the test environment will aim to address this for more comprehensive automated testing of this cross-module interaction.


## v0.8.0 (Conceptual - Main Test Suite Refactor)

**Date:** 2025-05-30

### Changed

* **Test Suite Refactoring (`test/run-tests.js`):**
    * Refactored the main test orchestrator (`test/run-tests.js`) to improve modularity and maintainability.
    * Moved common test utility functions into a new `test/test-helpers.js` file.
    * Centralized shared constants used by tests into a new `test/test-constants.js` file.
    * Organized individual test case definitions into categorized files within a new `test/test-cases/` directory. Categories include `config-command`, `convert-command`, `generate-command`, `plugin-create-command`, and `advanced-features`.
    * The main `test/run-tests.js` now imports test cases from these categorized files and acts as a lean orchestrator.
* **Test Runner CLI Enhancements:**
    * The test runner (`test/run-tests.js`) now accepts command-line arguments to selectively run specific test categories (e.g., `node test/run-tests.js config convert`).
    * Added a help interface to the test runner (e.g., `node test/run-tests.js help`) that lists available test categories and usage instructions for selective execution.
* All 26 existing tests were successfully migrated to the new structure and continue to pass.

