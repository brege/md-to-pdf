// src/utils/formatters/app-formatter.js
// Default app theme formatter with colored output
// lint-skip-file no-console

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (process.env.LOG_MODE === 'json' && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFilePath = path.join(logDir, 'app.log');

// Returns a colored string for the given level
function colorForLevel(level, message) {
  if (level === 'error' || level === 'fatal') return chalk.red(message);
  if (level === 'warn') return chalk.yellow(message);
  if (level === 'success') return chalk.green(message);
  if (level === 'info') return chalk.cyan(message);
  if (level === 'validation') return chalk.magentaBright(message); // custom validation color
  if (level === 'detail') return chalk.gray(message);
  if (level === 'debug') return chalk.magenta(message);
  return message;
}

// Format context prefix based on configuration
function formatContext(context, config = {}) {
  if (!context || !config.showContext) return '';

  const timestamp = config.showTimestamp ? ` ${new Date().toISOString()}` : '';

  if (config.contextStyle === 'prefix') {
    return `[${context}${timestamp}] `;
  } else if (config.contextStyle === 'suffix') {
    return ` [${context}${timestamp}]`;
  }

  return '';
}

// Format with default app theme (newline)
function formatApp(level, message, meta = {}) {
  const { context, config = {}, caller, stack, errorCategory, hint } = meta;

  if (process.env.LOG_MODE === 'json') {
    const entry = {
      level,
      message,
      ...meta,
      timestamp: new Date().toISOString()
    };
    fs.appendFileSync(logFilePath, JSON.stringify(entry) + '\n');
  } else {
    const contextPrefix = formatContext(context, config);
    let formattedMessage = config.contextStyle === 'suffix'
      ? message + formatContext(context, config)
      : contextPrefix + message;

    // Add enhanced debugging information
    if (caller) {
      formattedMessage += chalk.gray(` (${caller})`);
    }

    if (errorCategory && errorCategory !== 'general') {
      formattedMessage += chalk.blue(` [${errorCategory}]`);
    }

    console.log(colorForLevel(level, formattedMessage));

    // Display hint on next line if available
    if (hint) {
      console.log(chalk.gray(`  Hint: ${hint}`));
    }

    // Display stack trace if available
    if (stack && Array.isArray(stack)) {
      console.log(chalk.gray('  Stack trace:'));
      stack.forEach(line => {
        console.log(chalk.gray(`    ${line.trim()}`));
      });
    }
  }

  if (level === 'fatal') {
    process.exit(1);
  }
}

module.exports = {
  formatApp,
  colorForLevel
};
