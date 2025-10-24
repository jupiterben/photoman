#!/bin/bash
# Husky setup script (optional)
# Install husky for git hooks automation

echo "Setting up Git hooks with Husky..."

# Install husky
npm install --save-dev husky lint-staged

# Initialize husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create commit-msg hook for conventional commits
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit ${1}'

echo "Git hooks configured successfully!"
echo "Run 'npm install' to enable automatic formatting on commit."

