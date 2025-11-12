---
id: git-hooks-implementations
category: example
tags: [git, hooks, pre-commit, husky, automation, code-quality, linting, testing, validation]
capabilities:
  - Automate code quality checks before commits
  - Prevent commits with failing tests or lint errors
  - Enforce commit message standards
  - Run automated validations on Git operations
useWhen:
  - Setting up pre-commit hooks for code quality
  - Implementing automated validation in Git workflow
  - Enforcing team coding standards automatically
  - Need to prevent bad commits from entering repository
  - Configuring Husky or pre-commit frameworks
  - Automating linting and testing before commits
  - Ensuring consistent commit message format
  - Implementing Git workflow automation
  - Setting up client-side validation hooks
relatedResources:
  - git-commit-examples
  - git-pr-templates
  - github-actions-workflows
  - cicd-pipeline-optimization
  - code-quality-standards
  - testing-strategies
estimatedTokens: 680
---

# Git Hooks Implementation Examples

## Scenario

Implementing automated Git hooks to enforce code quality, run tests, validate commit messages, and prevent problematic code from being committed to the repository.

## Implementation

### Husky + lint-staged Setup (Node.js)

```bash
# Install Husky and lint-staged
npm install --save-dev husky lint-staged
npx husky install

# Add to package.json
```

```json
{
  "scripts": {
    "prepare": "husky install",
    "test": "jest",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\""
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Create commit-msg hook for conventional commits
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'

# Install commitlint
npm install --save-dev @commitlint/cli @commitlint/config-conventional

# Create commitlint.config.js
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert'
      ]
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100]
  }
};
EOF
```

### Python pre-commit Framework

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: detect-private-key
      - id: mixed-line-ending

  - repo: https://github.com/psf/black
    rev: 23.12.0
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: ["--profile", "black"]

  - repo: https://github.com/pycqa/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        args: ['--max-line-length=88', '--extend-ignore=E203']

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.1
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: [--strict, --ignore-missing-imports]

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.5
    hooks:
      - id: bandit
        args: ['-c', 'pyproject.toml']
        additional_dependencies: ['bandit[toml]']

  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: pytest
        language: system
        pass_filenames: false
        always_run: true
        args: ['--tb=short', '--maxfail=1']

      - id: safety-check
        name: safety-check
        entry: safety check
        language: system
        pass_filenames: false
```

```bash
# Install and setup
pip install pre-commit
pre-commit install
pre-commit install --hook-type commit-msg

# Run manually on all files
pre-commit run --all-files

# Update hooks to latest versions
pre-commit autoupdate
```

### Native Git Hooks (Shell Scripts)

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running pre-commit checks..."

# Check for debugging statements
if git diff --cached --name-only | xargs grep -n -E "(console\.log|debugger|pdb\.set_trace|binding\.pry)" 2>/dev/null; then
    echo "❌ Error: Debugging statements found. Remove them before committing."
    exit 1
fi

# Run linter
echo "Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed. Fix errors before committing."
    exit 1
fi

# Run tests
echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Fix tests before committing."
    exit 1
fi

# Check code formatting
echo "Checking code formatting..."
npm run format:check
if [ $? -ne 0 ]; then
    echo "❌ Code formatting issues found. Run 'npm run format' to fix."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
exit 0
```

```bash
# .git/hooks/commit-msg
#!/bin/bash

commit_msg_file=$1
commit_msg=$(cat "$commit_msg_file")

# Check for conventional commit format
conventional_commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .{1,50}'

if ! echo "$commit_msg" | grep -qE "$conventional_commit_regex"; then
    echo "❌ Invalid commit message format."
    echo ""
    echo "Commit message must follow conventional commits format:"
    echo "  <type>(<scope>): <subject>"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert"
    echo ""
    echo "Example: feat(auth): add OAuth2 login support"
    exit 1
fi

# Check for minimum message length
if [ ${#commit_msg} -lt 10 ]; then
    echo "❌ Commit message too short. Minimum 10 characters required."
    exit 1
fi

# Check for issue reference in commit body or subject
if ! echo "$commit_msg" | grep -qE "(#[0-9]+|JIRA-[0-9]+)"; then
    echo "⚠️  Warning: No issue reference found. Consider adding one."
    # Don't fail, just warn
fi

echo "✅ Commit message format valid!"
exit 0
```

```bash
# .git/hooks/pre-push
#!/bin/bash

echo "Running pre-push checks..."

# Get current branch
current_branch=$(git symbolic-ref --short HEAD)

# Prevent push to main/master without review
if [ "$current_branch" = "main" ] || [ "$current_branch" = "master" ]; then
    echo "❌ Direct push to $current_branch is not allowed."
    echo "Please create a feature branch and open a PR."
    exit 1
fi

# Run full test suite
echo "Running full test suite..."
npm run test:all
if [ $? -ne 0 ]; then
    echo "❌ Test suite failed. Fix tests before pushing."
    exit 1
fi

# Check for secrets
echo "Checking for secrets..."
if git diff --cached --name-only | xargs grep -E "(API_KEY|SECRET|PASSWORD|TOKEN)" | grep -v "example\|sample\|test"; then
    echo "❌ Potential secrets detected. Remove before pushing."
    exit 1
fi

echo "✅ All pre-push checks passed!"
exit 0
```

### Make Hooks Executable

```bash
# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/commit-msg
chmod +x .git/hooks/pre-push

# Or for all hooks at once
chmod +x .git/hooks/*
```

### Share Hooks with Team

```bash
# Create hooks directory in repo
mkdir -p .githooks

# Move hooks to .githooks
mv .git/hooks/* .githooks/

# Configure Git to use custom hooks directory
git config core.hooksPath .githooks

# Add to .gitignore
echo ".git/hooks" >> .gitignore

# Commit hooks to repository
git add .githooks/
git commit -m "chore: add Git hooks for code quality"
```

## Explanation

**Hook Types:**
- **pre-commit**: Runs before commit is created (linting, formatting, tests)
- **commit-msg**: Validates commit message format
- **pre-push**: Runs before pushing to remote (full test suite, security checks)
- **post-commit**: Runs after commit (notifications, logging)
- **pre-rebase**: Runs before rebase operation

**Framework Comparison:**

**Husky** (Node.js):
- Simple setup with npm scripts
- Great for JavaScript/TypeScript projects
- Integrates well with lint-staged for speed
- Good documentation and community support

**pre-commit** (Python):
- Language-agnostic, works with any project
- Large ecosystem of pre-built hooks
- Automatic hook installation and updates
- Better for polyglot or Python projects

**Native Git Hooks**:
- No dependencies required
- Full control over implementation
- Harder to share with team
- Requires manual setup on each clone

**Best Practices:**
- Keep hooks fast (< 10 seconds ideal)
- Use lint-staged to only check changed files
- Provide clear error messages
- Allow bypass with `--no-verify` for emergencies
- Document hook requirements in README
- Test hooks regularly to ensure they work
