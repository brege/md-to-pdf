// test/linting/unit/docs-linting.manifest.js
const fs = require('fs-extra');
const path = require('path');
const {
  postmanPath,
  librarianPath,
  janitorPath
} = require('@paths');

module.exports = [
  {
    describe: 'M.0.2.1 postman linter should report orphan link',
    scriptPath: postmanPath,
    sandboxPrefix: 'docs-postman-',
    setup: async (sandboxDir) => {
      await fs.writeFile(path.join(sandboxDir, 'test-doc.md'), '[broken](./non-existent.md)');
    },
    args: (sandboxDir) => ['test-doc.md'],
    assert: async ({ exitCode, stdout }) => {
      // Exits 1 for error per your linter convention
      expect(exitCode).to.equal(1);
      expect(stdout).to.match(/orphan reference: '\.\/non-existent\.md' not found/i);
      expect(stdout).to.match(/orphan-link/);
    },
  },
  {
    describe: 'M.0.2.2 janitor linter should warn on disallowed emojis',
    scriptPath: janitorPath,
    sandboxPrefix: 'docs-janitor-',
    setup: async (sandboxDir) => {
      await fs.writeFile(path.join(sandboxDir, 'bad-file.md'), 'This has a forbidden emoji: ❌'); // lint-skip-line janitor
    },
    args: (sandboxDir) => [sandboxDir],
    assert: async ({ exitCode, stdout }) => {
      expect(exitCode).to.equal(0);
      expect(stdout).to.match(/Disallowed emoji\(s\) found: ❌/i); // lint-skip-line janitor
    },
  },
  {
    describe: 'M.0.2.3 librarian linter should warn for dummy .js not listed in local scripts/index.md',
    scriptPath: librarianPath,
    sandboxPrefix: 'docs-librarian-dummy-',
    setup: async (sandboxDir) => {
      const scriptsDir = path.join(sandboxDir, 'scripts');
      await fs.mkdir(scriptsDir, { recursive: true });
      await fs.writeFile(path.join(scriptsDir, 'dummy.js'), '// not yet indexed!\n');
      await fs.writeFile(
        path.join(scriptsDir, 'index.md'),
        [
          '# Scripts List',
          '',
          '<!-- uncategorized-start -->',
          // blank section: dummy.js is missing
          '<!-- uncategorized-end -->',
        ].join('\n')
      );
      // This test is designed to run against the main project config
    },
    //args: (sandboxDir) => ['--group=scripts'],
    args: (sandboxDir) => [path.join(sandboxDir, 'scripts')],
    assert: async ({ exitCode, stdout }) => {
      expect(exitCode).to.equal(0);
      expect(stdout).to.match(/Untracked file: 'dummy\.js'/i);
      expect(stdout).to.match(/missing-index-entry/);
    },
  },
];
