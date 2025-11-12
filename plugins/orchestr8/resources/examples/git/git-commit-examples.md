---
id: git-commit-examples
category: example
tags: [git, commits, conventional-commits, best-practices, version-control, code-quality, documentation, team-collaboration]
capabilities:
  - Write clear, meaningful commit messages
  - Follow conventional commit format
  - Structure commits for better history tracking
  - Communicate changes effectively to team
useWhen:
  - Writing commit messages for new features or changes
  - Establishing commit message standards for a team
  - Need examples of good vs bad commit practices
  - Implementing conventional commits in a project
  - Learning how to write descriptive commit messages
  - Reviewing commit history and improving quality
  - Setting up commit message linting tools
  - Teaching Git best practices to developers
  - Creating meaningful project changelogs
relatedResources:
  - git-pr-templates
  - git-hooks-implementations
  - github-actions-workflows
  - git-workflow
  - code-quality-standards
estimatedTokens: 650
---

# Git Commit Message Examples

## Scenario

Writing clear, structured commit messages that communicate changes effectively and follow conventional commit standards for better maintainability and automated changelog generation.

## Implementation

### Conventional Commit Format

```bash
# Format: <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert
```

### Good Commit Examples

```bash
# Feature with breaking change
feat(auth)!: implement OAuth2 authentication flow

Replace JWT token-based auth with OAuth2 to support
third-party authentication providers. This improves
security and enables social login features.

BREAKING CHANGE: AuthService.login() now returns Promise<OAuthToken>
instead of Promise<JWTToken>. Update all auth implementations.

Closes #234

# Bug fix with context
fix(api): prevent race condition in user profile updates

Add mutex lock when updating user profiles to prevent
concurrent requests from overwriting each other's changes.
This resolves data corruption issues reported in production.

Fixes #456

# Performance improvement
perf(database): optimize user query with composite index

Add composite index on (user_id, created_at) columns
to speed up user activity queries by 85%. Query time
reduced from 450ms to 68ms on 1M record dataset.

# Refactoring
refactor(payments): extract Stripe logic into separate service

Move all Stripe-specific code from OrderController to
PaymentService for better separation of concerns and
easier testing.

# Documentation
docs(api): add authentication examples to API guide

Include code examples for OAuth2 flow, token refresh,
and error handling scenarios.

# Chore
chore(deps): upgrade React from 17.0.2 to 18.2.0

Update React and related dependencies to latest stable
version for better performance and new features.
```

### Bad Commit Examples (Don't Do This)

```bash
# ❌ Too vague
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"

# ❌ Too much in one commit
git commit -m "add login, fix navbar, update readme, refactor API"

# ❌ No context
git commit -m "fix typo"
# Which typo? Where? Why does it matter?

# ❌ Non-descriptive
git commit -m "wip"
git commit -m "temp"
git commit -m "asdf"

# ❌ Multiple concerns mixed
git commit -m "add user profile page and fix database connection and update tests"
```

### Commit Message Template

```bash
# Create ~/.gitmessage
cat > ~/.gitmessage << 'EOF'
# <type>(<scope>): <subject>
# |<----  Preferably using 50 characters  ---->|

# Explain why this change is being made
# |<----   Try to limit to 72 characters   ---->|

# Provide links to related issues/tickets
# Example: Fixes #123, Closes #456

# --- COMMIT END ---
# Type can be:
#    feat     (new feature)
#    fix      (bug fix)
#    refactor (refactoring code)
#    style    (formatting, missing semicolons, etc; no code change)
#    docs     (changes to documentation)
#    test     (adding or refactoring tests; no production code change)
#    chore    (updating grunt tasks etc; no production code change)
#    perf     (performance improvements)
#    ci       (continuous integration related)
#    build    (build system changes)
#    revert   (reverting previous commit)
# --------------------
# Remember to:
#   - Capitalize the subject line
#   - Use the imperative mood ("add" not "added")
#   - Don't end subject line with period
#   - Separate subject from body with blank line
#   - Use body to explain what and why vs. how
#   - Can use multiple lines with "-" for bullet points in body
EOF

# Configure Git to use the template
git config --global commit.template ~/.gitmessage
```

## Explanation

**Conventional Commits** provide a standardized format that:
- Enables automated changelog generation
- Makes it easier to understand the type of changes
- Helps with semantic versioning decisions
- Improves collaboration through clear communication

**Best Practices:**
- **Subject line**: Imperative mood, 50 characters or less, no period
- **Body**: Explain the "why" not the "what", wrap at 72 characters
- **Footer**: Reference issues, note breaking changes
- **Atomic commits**: One logical change per commit
- **Present tense**: "add feature" not "added feature"

**Breaking Changes** should always be noted with `BREAKING CHANGE:` in the footer or `!` after the type/scope to trigger major version bumps in semantic versioning.
