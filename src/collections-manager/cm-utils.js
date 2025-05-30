// dev/src/collections-manager/cm-utils.js
const path = require('path');

/**
 * Derives a sanitized collection name from a source URL or path.
 * @param {string} source - The source URL or local path.
 * @returns {string} A sanitized string suitable for use as a directory name.
 */
function deriveCollectionName(source) {
  if (!source || typeof source !== 'string') {
    return ''; // Or throw an error, depending on desired strictness
  }
  const baseName = path.basename(source);
  // Remove .git suffix, then replace non-alphanumeric (excluding hyphen/underscore) with hyphen
  return baseName.replace(/\.git$/, '').replace(/[^a-zA-Z0-9_-]/g, '-');
}

/**
 * Converts a hyphenated string to PascalCase.
 * e.g., "my-plugin-name" -> "MyPluginName"
 * @param {string} str - The input string.
 * @returns {string} The PascalCase string.
 */
function toPascalCase(str) {
  if (!str) return '';
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

module.exports = {
  deriveCollectionName,
  toPascalCase, // Added
};
