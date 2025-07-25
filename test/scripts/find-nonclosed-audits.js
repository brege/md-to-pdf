// test/scripts/find-nonclosed-audits.js
require('module-alias/register');
const { integrationTestDir, e2eTestDir, docsTestDir, loggerPath } = require('@paths');

const logger = require(loggerPath);
const fs = require('fs');
const path = require('path');

function findAllJsFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findAllJsFiles(filePath));
    } else if (file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  return results;
}
function buildTestIdToPathMap() {
  const dirs = [
    integrationTestDir,
    e2eTestDir
  ];
  const testIdToPath = {};
  dirs.forEach(dir => {
    findAllJsFiles(dir).forEach(file => {
      const match = file.match(/\.test\.((?:\d+\.)*\d+)\.js$/);
      if (match) {
        const testId = match[1];
        const idx = file.lastIndexOf('/test/');
        const relPath = idx !== -1 ? file.slice(idx + 1) : file;
        testIdToPath[testId] = relPath;
      }
    });
  });
  return testIdToPath;
}
const testIdToPath = buildTestIdToPathMap();

const AUDIT_LOG = path.join(docsTestDir, 'audit-log.md');
const lines = fs.readFileSync(AUDIT_LOG, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const entryMatch = line.match(/^## Entry: (.+)$/);
  if (entryMatch) {
    const entryLineNum = i + 1;
    let testIdRaw = entryMatch[1].trim();
    let status = null;
    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
      const tidMatch = lines[j].match(/- \*\*test_id:\*\* (.+)$/);
      if (tidMatch) testIdRaw = tidMatch[1].trim();
      const statusMatch = lines[j].match(/- \*\*status:\*\* (.+)$/);
      if (statusMatch) { status = statusMatch[1].trim().toUpperCase(); break; }
      if (lines[j].startsWith('## Entry:')) break;
    }
    if (status !== 'CLOSED') {
      const testIds = testIdRaw.split(',').map(s => s.trim()).filter(Boolean);
      for (const testId of testIds) {
        if (!/^\d+(\.\d+)*$/.test(testId)) continue; // Only numeric codes
        const relPath = testIdToPath[testId] || '';
        const tid = testId.padEnd(8);
        const audit = `audit-log:${entryLineNum}`.padEnd(16);
        logger.info(`${tid}${audit}${relPath}`);
      }
    }
  }
}
