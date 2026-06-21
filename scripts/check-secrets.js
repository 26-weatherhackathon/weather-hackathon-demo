#!/usr/bin/env node

/**
 * Secret scanning script - detects hardcoded credentials
 * Runs on staged files to prevent accidental commits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PATTERNS = [
  // API Keys
  { name: 'AWS Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'Stripe Secret', pattern: /sk_(live|test)_[0-9a-zA-Z]{20,}/ },
  { name: 'Stripe Public', pattern: /pk_(live|test)_[0-9a-zA-Z]{20,}/ },

  // GitHub Tokens
  { name: 'GitHub Token', pattern: /ghp_[0-9a-zA-Z]{36}/ },
  { name: 'GitHub User Token', pattern: /ghu_[0-9a-zA-Z]{36}/ },
  { name: 'GitHub OAuth', pattern: /gho_[0-9a-zA-Z]{36}/ },
  { name: 'GitHub App Token', pattern: /ghu_[0-9a-zA-Z]{36}/ },

  // Generic secrets
  { name: 'Bearer Token', pattern: /bearer\s+[a-zA-Z0-9\-._~\+\/]+=*\b/i },
  { name: 'API Key Assignment', pattern: /(?:api[_-]?key|apikey|api_secret)\s*[:=]\s*['\"][^'\"]*['\"](?!.*process\.env)/i },
  { name: 'Password Assignment', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['\"][^'\"]{6,}['\"](?!.*process\.env)/i },
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'build',
  'dist',
  'coverage',
];

const EXCLUDE_FILES = [
  '.md',
  '.lock',
  '.yarn-integrity',
];

function shouldExclude(filePath) {
  if (EXCLUDE_FILES.some(ext => filePath.endsWith(ext))) {
    return true;
  }

  const parts = filePath.split(path.sep);
  return parts.some(part => EXCLUDE_DIRS.includes(part));
}

function scanContent(content, filePath) {
  const issues = [];

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return;
    }

    // Skip lines with process.env (these are safe)
    if (line.includes('process.env') || line.includes('import.meta.env')) {
      return;
    }

    // Skip lines that are pattern definitions or examples
    if (line.includes('pattern:') || line.includes('PATTERNS') || line.includes('name:')) {
      return;
    }

    PATTERNS.forEach(({ name, pattern }) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          secret: name,
          content: line.trim().substring(0, 80),
        });
      }
    });
  });

  return issues;
}

function getFilesToCheck() {
  try {
    // Get staged files from git
    const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    return stagedFiles.filter(file => !shouldExclude(file));
  } catch (e) {
    // If not in git repo or no staged files, return empty
    return [];
  }
}

function main() {
  const filesToCheck = getFilesToCheck();

  if (filesToCheck.length === 0) {
    console.log('✓ No files to check');
    process.exit(0);
  }

  const allIssues = [];

  filesToCheck.forEach(file => {
    if (!fs.existsSync(file)) return;

    const content = fs.readFileSync(file, 'utf-8');
    const issues = scanContent(content, file);
    allIssues.push(...issues);
  });

  if (allIssues.length === 0) {
    console.log('✓ No secrets detected');
    process.exit(0);
  }

  console.error('❌ Potential secrets detected:\n');
  allIssues.forEach(issue => {
    console.error(`  ${issue.file}:${issue.line}`);
    console.error(`    ${issue.secret}: ${issue.content}`);
    console.error();
  });

  console.error(`\nFound ${allIssues.length} potential secret(s).`);
  console.error('Use environment variables instead (process.env.YOUR_SECRET)');
  console.error('\nTo bypass (use with caution): SKIP_SECRETS_CHECK=1 git commit');

  process.exit(1);
}

if (require.main === module) {
  if (process.env.SKIP_SECRETS_CHECK) {
    console.log('⚠ Secret check skipped');
    process.exit(0);
  }
  main();
}

module.exports = { scanContent, shouldExclude };
