const fs = require('fs');
const path = require('path');

const gitHooksDir = path.join(__dirname, '.git', 'hooks');
const preCommitHookPath = path.join(gitHooksDir, 'pre-commit');

const hookContent = `#!/bin/sh
# DEIWARE Auto-Version Pre-Commit Hook
echo "Bumping version and updating metadata..."
node update-version.js
git add version.json version.md package.json
`;

if (fs.existsSync(path.join(__dirname, '.git'))) {
  if (!fs.existsSync(gitHooksDir)) {
    fs.mkdirSync(gitHooksDir, { recursive: true });
  }

  fs.writeFileSync(preCommitHookPath, hookContent, { mode: 0o755 });
  console.log('Successfully installed pre-commit hook in .git/hooks/pre-commit');
} else {
  console.error('.git directory not found. Make sure you are in the root of a Git repository.');
}
