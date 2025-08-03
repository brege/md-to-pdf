> #### Draft: [`docs/ai/interaction-spec.md`](interaction-spec.md)

# AI Interaction Specification for `oshea` Plugins

This document provides the core technical details required to programmatically generate a plugin for the `oshea` system.

## 1\. Plugin Handler Interface

All plugins must export a handler class that adheres to the following interface.

### Constructor: `constructor(coreUtils)`

The constructor is instantiated by the `PluginManager` and receives a single `coreUtils` object. It is best practice to store these utilities on `this` for use in the `generate` method.

  * `coreUtils` (Object): An object containing core application modules.
      * `DefaultHandler` (Class): The standard handler for basic Markdown-to-PDF conversion. Can be instantiated (`new this.DefaultHandler()`) and used for delegation.
      * `markdownUtils` (Object): A collection of functions for processing Markdown.
      * `pdfGenerator` (Object): A utility for creating the final PDF.

### Method: `async generate(data, pluginConfig, globalConfig, outputDir, outputFilenameOpt, pluginBasePath)`

This is the main entry point for the plugin.

  * `data` (Object): Input data for the plugin. For `convert` commands, this will be `{ markdownFilePath: '...' }`. For `generate` commands, it is `{ cliArgs: { ... } }`.
  * `pluginConfig` (Object): The fully resolved configuration object for this plugin, after all overrides have been applied.
  * `globalConfig` (Object): The main application configuration.
  * `outputDir` (String): The absolute path to the designated output directory.
  * `outputFilenameOpt` (String | null): A user-specified filename for the output PDF.
  * `pluginBasePath` (String): The absolute path to the root directory of the plugin being executed. This is crucial for resolving local assets like CSS files.

## 2\. Core Utilities API (`coreUtils`)

### `markdownUtils`

  * **`extractFrontMatter(markdownContent)`**: Separates YAML front matter from Markdown body.
      * **Returns:** `{ data: Object, content: String }`
  * **`renderMarkdownToHtml(markdownContent, tocOptions, ...)`**: Renders a Markdown string into an HTML string.
      * **Returns:** `String` (HTML)

### `pdfGenerator`

  * **`generatePdf(htmlBodyContent, outputPdfPath, pdfOptions, cssFileContentsArray)`**: The final step to create the PDF.
      * `htmlBodyContent` (String): The complete HTML body to be rendered.
      * `outputPdfPath` (String): The absolute path where the PDF will be saved.
      * `pdfOptions` (Object): Puppeteer-compatible options for page size, margins, etc.
      * `cssFileContentsArray` (Array\<String\>): An array of strings, where each string is the full content of a CSS file.

## 3\. The Minimal Context Package

To correctly orient an AI assistant, provide it with the following three components in a single prompt:

1.  **This Interaction Specification (`interaction-spec.md`)**: To define the technical rules.
2.  **The Plugin Contract ([`docs/refs/plugin-contract.md`](../refs/plugin-contract.md))**: To define the required file structure and metadata.
3.  **The `template-basic` Source Code**: Provide the full contents of `template-basic.config.yaml` and `index.js` as a minimal, working example to be modified.

This three-part package forms the complete context necessary for an AI to begin development. A script to automate the concatenation of these files would be the logical next step after this specification is finalized.
