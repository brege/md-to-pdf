# md-to-pdf Cheat Sheet

Quick examples and syntax for `md-to-pdf` commands and configurations.

## Core Commands & Common Use Cases

**1. Convert a Basic Markdown File (Default Plugin)**

  * Uses the `default` plugin.
  * Outputs to the same directory as the input.
  * Auto-opens PDF if `pdf_viewer` is set.

    ```bash
    md-to-pdf convert my_document.md
    ```

**2. Convert a CV (Specific Plugin & Output)**

  * Uses the `cv` plugin.
  * Specifies output directory and filename.
  * Disables auto-opening.

    ```bash
    md-to-pdf convert examples/example-cv.md --plugin cv --outdir exports --filename "JohnDoe_CV.pdf" --no-open
    ```

**2.b. Convert a CV with Watch Mode - Readably**

  * Uses the `cv` plugin.
  * Watches for changes in `my_cv.md` and related config/CSS.

    ```bash
    md-to-pdf convert 'examples/example-cv.md' \
      --plugin cv \ 
      --outdir exports/ \
      --filename "JohnDoe_CV.pdf" \
      --watch
    ```

**3. Convert a Recipe with Watch Mode**

  * Uses the `recipe` plugin.
  * Watches for changes in `my_recipe.md` and related config/CSS.

    ```bash
    md-to-pdf convert examples/example-recipe.md --plugin recipe --watch
    ```

**4. Generate a Recipe Book**

  * Uses the `recipe-book` plugin (a `generate` command type).
  * Specifies the source directory for individual recipe Markdown files.

    ```bash
    md-to-pdf generate recipe-book --recipes-base-dir examples/hugo-example --outdir ./books --filename "FamilyCookbook.pdf"
    ```

**4.b. Generate a Recipe Book with Watch Mode - Readably**

  * Uses the `recipe-book` plugin (a `generate` command type).
  * Watches for changes in `my_recipe.md` and related config/CSS.

    ```bash
    md-to-pdf generate recipe-book \
        --recipes-base-dir 'examples/hugo-example' \
        --outdir ./books \
        --filename "FamilyCookbook.pdf" \
        --watch
    ```

**5. Convert a Document with Math (KaTeX)**

  * Assumes `math` is enabled in `config.yaml` or plugin config.
  * Uses the `default` plugin (or any plugin that supports math).
  * Input file: `examples/example-math.md`

    ```bash
    md-to-pdf convert examples/example-math.md --plugin default --outdir output
    ```

**6. Using a Project-Specific Configuration**

  * Overrides bundled/XDG settings with those in `project.config.yaml`.
  * Useful for project-specific styles or plugin registrations.

    ```bash
    md-to-pdf convert my_report.md --plugin report --config ./configs/project.config.yaml
    ```

**7. Using Only Factory Defaults**

  * Ignores all XDG and project-specific (`--config`) configurations.
  * Useful for debugging or getting a "vanilla" output.

    ```bash
    md-to-pdf convert my_doc.md --plugin default --factory-defaults
    ```

**8. Batch Processing 'Eaches'**

  * For batch operations (e.g., converting all recipes from a Hugo content folder or other collections), `md-to-pdf` now recommends using external scripts.
  * See the [Batch Processing Guide](./batch-processing-guide.md) for examples in Node.js and Bash.
    
    **Bash Example**
    
    ```bash
    ./scripts/batch_convert_hugo_recipes.sh ./examples/hugo-example \
                                            ./batch_output/hugo_recipes_bash \
                                            recipe
    ```

    **Node.js Example**
    
    ```bash
    node ./scripts/batch_convert_hugo_recipes.js \
        --source-dir ./examples/hugo-example \
        --output-dir ./batch_output/hugo_recipes_node \
        --base-plugin recipe
    ```

## Plugin Management Commands

**1. List Discoverable Plugins**

  * Lists all plugins found via Bundled, XDG, and Project configurations.
  * Shows name, description, registration source, and config file path for each.
  * Respects global `--config` and `--factory-defaults` flags.
    
    ```bash     
    md-to-pdf plugin list
    md-to-pdf plugin list --factory-defaults
    ```

**2. Create Plugin Boilerplate**

  * Generates a starting structure for a new plugin.

    ```bash
    md-to-pdf plugin create <your-plugin-name> [--dir <output-directory>] [--force]
    ```
    Example:
    ```bash
    md-to-pdf plugin create my-invoice --dir ./custom-plugins
    ```
    This creates `./custom-plugins/my-invoice/` with `my-invoice.config.yaml`, `index.js`, and `my-invoice.css`.
    Remember to register the new plugin in a `config.yaml` file afterwards.

**3. Get Help for a Specific Plugin**

  * Displays detailed help information for a named plugin, sourced from its `README.md` front matter.

    ```bash
    md-to-pdf plugin help <pluginName>
    ```
    Example:
    ```bash
    md-to-pdf plugin help cv
    ```

## Configuration Inspection

**1. Display Active Global Configuration**

  * Shows paths to active main configuration files and key global settings.
  * Respects global `--config` and `--factory-defaults` flags.

    ```bash
    md-to-pdf config
    ```
    Output with XDG config active:
    ```
    # Configuration Sources:
    #   Primary Main Config Loaded: /home/user/.config/md-to-pdf/config.yaml (XDG Global)
    #   Considered Bundled Main Config (config.yaml): /path/to/md-to-pdf/config.yaml

    # Active Global Configuration:

    pdf_viewer: xdg-open
    global_pdf_options:
      format: Letter
      # ... more global settings ...
    params:
      some_global_param: "value"
    # ... etc. ...

    # Note: This shows the global settings from the primary main configuration file.
    # To see the full effective configuration for a specific plugin, use 'md-to-pdf config --plugin <pluginName>'.
    ```

**2. Display Effective Configuration for a Specific Plugin**

  * Shows the fully resolved configuration for the specified plugin, including all applied overrides and merged global settings.
  * Also details the source files that contributed to this configuration.
  * Respects global `--config` and `--factory-defaults` flags.

    ```bash
    md-to-pdf config --plugin cv
    ```
    Example Output:
    ```
    # Effective configuration for plugin: cv

    description: Plugin for Curriculum Vitae (CV) documents.
    handler_script: index.js
    css_files:
      - /path/to/md-to-pdf/plugins/cv/cv.css
    pdf_options:
      format: A4
      # ... other effective PDF options for cv ...
    # ... etc. ...

    # Source Information:
    #   Plugin Base Path: /path/to/md-to-pdf/plugins/cv
    #   Handler Script Path: /path/to/md-to-pdf/plugins/cv/index.js
    #   Contributing Configuration Files (most specific last):
    #     - Primary Main Config (for global settings): /home/user/.config/md-to-pdf/config.yaml
    #     - /path/to/md-to-pdf/plugins/cv/cv.config.yaml

    # Resolved CSS Files (order matters):
    #     - /path/to/md-to-pdf/plugins/cv/cv.css
    ```

**3. Display Pure Configuration (for Copy-Pasting)**

  * Use the `--pure` flag with `md-to-pdf config` (with or without `--plugin`) to output only the raw YAML configuration data.
  * This strips all comments, headers, and informational text, making it suitable for copying into a configuration file.

    ```bash
    md-to-pdf config --pure
    md-to-pdf config --plugin cv --pure
    ```
    Example Output for `md-to-pdf config --plugin cv --pure`:
    ```yaml
    description: Plugin for Curriculum Vitae (CV) documents.
    handler_script: index.js
    css_files:
      - /path/to/md-to-pdf/plugins/cv/cv.css
    pdf_options:
      format: A4
      # ... etc. ...
    # ... only the YAML content ...
    ```


## Config Snippets (`config.yaml`)

### PDF Viewer

```yaml
# ~/.config/md-to-pdf/config.yaml OR project's config.yaml
pdf_viewer: xdg-open # Linux
# pdf_viewer: "open -a Preview" # macOS
# pdf_viewer: null # Disable auto-open
# pdf_viewer: firefox # Also an excellent choice
```

### Global PDF Options (e.g., Page Size, Margins)

```yaml
# In global_pdf_options:
format: "A4"
margin: { top: "0.75in", bottom: "0.75in", left: "1in", right: "1in" }
printBackground: true
```

### Enabling Math (KaTeX) & Custom Macros

```yaml
math:
  enabled: true
  engine: "katex" # Currently only katex
  katex_options:
    throwOnError: false
    trust: false # SECURITY: incase user doesn't use @vscode version 
    macros:
      "\\RR": "\\mathbb{R}"
      "\\boldvec": "\\mathbf{#1}"
```


### Defining Global Parameters (`params`)

Define reusable key-value pairs in your main `config.yaml` that can be used as placeholders in Markdown. These are merged with document front matter, with front matter taking precedence.

```yaml
# In your main config.yaml (e.g., ~/.config/md-to-pdf/config.yaml or project's --config file)
params:
  site:
    name: "My Awesome Site"
    url: "https://example.com"
  authorContact:
    name: "Default Author"
    email: "author@example.com"
  projectVersion: "1.0.0"
```

Markdown:
```markdown
---
title: "My Page"
authorContact: # This will override the authorContact.name from params
  name: "Page Specific Author"
---

# Welcome to {{ .site.name }}!

This page is by {{ .authorContact.name }}.
Site version: {{ .projectVersion }}.
Contact us at {{ .authorContact.email }}.
```

### Registering a Custom Plugin

Assuming your plugin `my-notes`'s config is at `~/my_md_plugins/my-notes-plugin/my-notes.config.yaml`.

```yaml
# In ~/.config/md-to-pdf/config.yaml OR project's --config file
document_type_plugins:
  # Bundled plugin overrides maybe listed here...
  # Custom plugin:
  my-notes: "~/my_md_plugins/my-notes-plugin/my-notes.config.yaml" 
  # For a plugin created by `md-to-pdf plugin create my-notes --dir .`
  # my-notes: "./my-notes/my-notes.config.yaml" # If config is in project root
```

More details in the [Plugin Development Guide](./plugin-development.md).


## Markdown & Front Matter Essentials

**Front Matter for Metadata & Placeholders:**

```yaml
---
title: "My Awesome Document"
author: "Your Name"
date: "{{ .CurrentDateISO }}" # Dynamic date
tags: ["notes", "project-x"]
custom_field: "Hello World"
---

# {{ title }}

Authored by: {{ author }} on {{ date }}.
Custom: {{ custom_field }}
Today's long date: {{ .CurrentDateFormatted }}
```

**Example**

```bash
md-to-pdf convert examples/example-front-matter.md --plugin default --outdir output
```

**Math Delimiters (KaTeX):**

  * Inline: `The equation is $E = mc^2$.`
  * Display: `$$ f(x) = \\int_{-\\infty}^\\infty \\hat{f}(\\xi)\\,e^{2 \\pi i \\xi x} \\,d\\xi $$`
  * These won't work: `\\( ... \\)` (inline), `\\[ ... \\]` (display)

  * **Example**

    ```bash
    md-to-pdf convert examples/example-math.md --plugin default --outdir output
    ```

## Plugin Creation Basics (using `plugin create`)

1.  **Generate Boilerplate**:
    ```bash
    md-to-pdf plugin create my-custom-plugin --dir ./path/to/where/plugins_live
    ```
    This creates `my-custom-plugin/` containing:
    * `my-custom-plugin.config.yaml`
    * `index.js` (handler expecting `coreUtils` in constructor)
    * `my-custom-plugin.css`
2.  **Customize**: Edit the generated files. The `index.js` handler will already be set up to use `DefaultHandler` via dependency injection.
3.  **Register**: Add your plugin to a `config.yaml` (see [Registering a Custom Plugin](#registering-a-custom-plugin) above).
4.  **Invoke**: `md-to-pdf convert my_file.md --plugin my-custom-plugin`

## Configuration Layers

Overrides apply in this order (highest wins):

1.  Project (`--config your_project.yaml`)
2.  XDG User (`~/.config/md-to-pdf/config.yaml` & `~/.config/md-to-pdf/<plugin>/<plugin>.config.yaml`)
3.  Bundled (tool's default `config.yaml` & `plugins/<plugin>/<plugin>.config.yaml`)

## Troubleshooting

  * **CSS Not Working?** Check paths in `css_files` (relative to the `*.config.yaml` they are in). Is `inherit_css: false` in an override, replacing all prior CSS?
  * **Math Issues?** Ensure `math.enabled: true`. Check delimiters and LaTeX syntax.
  * **Plugin Unknown?** Verify registration in `document_type_plugins` and path correctness (see the [Plugin Development Guide](./plugin-development.md) for details). Use `md-to-pdf plugin list`. 

---

Refer to the full [`README.md`](../README.md) for detailed explanations.

