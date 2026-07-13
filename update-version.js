const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionJsonPath = path.join(__dirname, 'version.json');
const versionMdPath = path.join(__dirname, 'version.md');

// 1. Get commit SHA
let commitSha = 'dev';
try {
  commitSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  commitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.substring(0, 7) : 'dev';
}

// 2. Format current date in Turkish Time Zone (GMT+3)
const buildDate = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

// 3. Read current version
let versionData = { version: 'v0.0.0', commit: 'dev', date: '' };
if (fs.existsSync(versionJsonPath)) {
  try {
    versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  } catch (e) {
    console.error('Failed to parse version.json, resetting.', e);
  }
}

// Ensure version format is valid
let versionStr = versionData.version || 'v0.0.0';
if (versionStr.startsWith('v')) {
  versionStr = versionStr.substring(1);
}

// 4. Increment version
const parts = versionStr.split('.').map(Number);
if (parts.length === 3 && !parts.some(isNaN)) {
  parts[2] = parts[2] + 1;
  versionData.version = `v${parts.join('.')}`;
} else {
  versionData.version = 'v0.0.1';
}

versionData.commit = commitSha;
versionData.date = buildDate;

// 5. Write version.json
fs.writeFileSync(versionJsonPath, JSON.stringify(versionData, null, 2) + '\n');
console.log(`Updated version.json: ${versionData.version} (${versionData.commit})`);

// 6. Write version.md
const mdContent = `# DEIWARE Version Details
- Version: ${versionData.version}
- Commit SHA: ${versionData.commit}
- Build Date: ${versionData.date}
`;
fs.writeFileSync(versionMdPath, mdContent);
console.log(`Updated version.md`);
