---
id: git-troubleshooting-scenarios
category: example
tags: [git, troubleshooting, debugging, recovery, problem-solving, version-control, git-rescue, workflows]
capabilities:
  - Diagnose and fix common Git problems
  - Recover from Git mistakes and errors
  - Resolve merge conflicts effectively
  - Undo commits and changes safely
useWhen:
  - Encountering Git errors or unexpected behavior
  - Need to undo commits or changes
  - Resolving merge conflicts in repositories
  - Recovering lost commits or files
  - Fixing repository corruption or issues
  - Need to rewrite commit history safely
  - Dealing with detached HEAD state
  - Recovering from force push accidents
  - Cleaning up messy Git history
  - Troubleshooting remote repository issues
relatedResources:
  - git-commit-examples
  - git-hooks-implementations
  - git-workflow
  - git-pr-templates
  - code-quality-standards
estimatedTokens: 670
---

# Git Troubleshooting Scenarios

## Scenario

Common Git problems developers encounter and step-by-step solutions for diagnosing, fixing, and recovering from various Git mishaps.

## Implementation

### 1. Undo Last Commit (Keep Changes)

```bash
# Scenario: Committed too early, want to modify before pushing

# Undo commit but keep changes staged
git reset --soft HEAD~1

# Undo commit and unstage changes
git reset HEAD~1

# Verify status
git status

# Make additional changes, then recommit
git add .
git commit -m "feat: complete implementation with additional fixes"
```

### 2. Undo Last Commit (Discard Changes)

```bash
# Scenario: Committed completely wrong changes

# WARNING: This permanently deletes changes
git reset --hard HEAD~1

# If already pushed, you need force push (dangerous!)
git push --force-with-lease origin branch-name

# Safer: Revert the commit (creates new commit)
git revert HEAD
git push origin branch-name
```

### 3. Amend Last Commit

```bash
# Scenario: Forgot to add files or fix typo in commit message

# Stage additional files
git add forgotten-file.js

# Amend last commit
git commit --amend --no-edit

# Or amend with new message
git commit --amend -m "feat(auth): add OAuth2 with all required files"

# If already pushed
git push --force-with-lease origin branch-name
```

### 4. Recover Deleted Branch

```bash
# Scenario: Accidentally deleted a branch with important commits

# Find the commit SHA of the deleted branch
git reflog

# Output shows:
# abc1234 HEAD@{0}: checkout: moving from feature-branch to main
# def5678 HEAD@{1}: commit: Important work

# Recreate branch at that commit
git checkout -b feature-branch-recovered def5678

# Or cherry-pick specific commits
git cherry-pick def5678
```

### 5. Resolve Merge Conflicts

```bash
# Scenario: Pull or merge resulted in conflicts

# Check which files have conflicts
git status

# Option 1: Manually resolve conflicts
# Edit files, look for conflict markers:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name

# After resolving, stage files
git add resolved-file.js

# Complete the merge
git commit

# Option 2: Accept all changes from one side
git checkout --ours conflicted-file.js  # Keep your version
git checkout --theirs conflicted-file.js  # Keep their version
git add conflicted-file.js

# Option 3: Abort merge and start over
git merge --abort
```

### 6. Undo File Changes (Before Commit)

```bash
# Scenario: Modified files but want to discard changes

# Discard changes to specific file
git checkout -- file.js

# Discard all unstaged changes
git checkout -- .

# Remove untracked files and directories
git clean -fd

# Preview what will be cleaned
git clean -fd --dry-run

# Unstage files but keep modifications
git reset HEAD file.js
```

### 7. Fix Detached HEAD State

```bash
# Scenario: Checked out a commit directly, now in detached HEAD

# Check current state
git status
# Output: HEAD detached at abc1234

# Option 1: Create a branch from here
git checkout -b recovery-branch

# Option 2: Return to a branch
git checkout main

# If you made commits in detached state
git log  # Note the commit SHA
git checkout main
git cherry-pick <commit-sha>
```

### 8. Recover Lost Commits

```bash
# Scenario: Used reset --hard and lost commits

# Find lost commits in reflog
git reflog

# Output shows all HEAD movements:
# abc1234 HEAD@{0}: reset: moving to HEAD~1
# def5678 HEAD@{1}: commit: Lost important work

# Recover the lost commit
git cherry-pick def5678

# Or reset to that commit
git reset --hard def5678
```

### 9. Clean Up Commit History Before Push

```bash
# Scenario: Multiple messy commits, want to clean up before push

# Interactive rebase last 5 commits
git rebase -i HEAD~5

# Editor opens with options:
# pick abc1234 work in progress
# pick def5678 fix typo
# pick ghi9012 more fixes
# pick jkl3456 final changes
# pick mno7890 forgot this file

# Change to:
# pick abc1234 work in progress
# squash def5678 fix typo
# squash ghi9012 more fixes
# squash jkl3456 final changes
# squash mno7890 forgot this file

# Save and close editor, then write combined commit message
```

### 10. Fix Wrong Branch Commits

```bash
# Scenario: Made commits on main instead of feature branch

# Create new branch with current commits
git branch feature-branch

# Reset main to remote state
git checkout main
git reset --hard origin/main

# Switch to feature branch to continue work
git checkout feature-branch
```

### 11. Remove File from All History

```bash
# Scenario: Accidentally committed sensitive file, need to remove completely

# Using BFG Repo-Cleaner (faster)
java -jar bfg.jar --delete-files secrets.env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Using git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secrets.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to all branches
git push --force --all
git push --force --tags
```

### 12. Sync Fork with Upstream

```bash
# Scenario: Your fork is behind the upstream repository

# Add upstream remote (once)
git remote add upstream https://github.com/original/repo.git

# Fetch upstream changes
git fetch upstream

# Checkout your main branch
git checkout main

# Merge upstream changes
git merge upstream/main

# Push to your fork
git push origin main

# Alternative: Rebase instead of merge
git rebase upstream/main
git push --force-with-lease origin main
```

### 13. Fix "Repository Not Found" Error

```bash
# Scenario: Cannot push or pull, get authentication errors

# Check current remote URL
git remote -v

# Update remote URL to use SSH
git remote set-url origin git@github.com:username/repo.git

# Or use HTTPS with token
git remote set-url origin https://username:TOKEN@github.com/username/repo.git

# Test connection
git fetch

# Update credentials (if using HTTPS)
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'
```

### 14. Resolve "Diverged Branches" Error

```bash
# Scenario: Local and remote branches have diverged

# Check status
git status
# Output: Your branch and 'origin/main' have diverged

# Option 1: Merge remote changes
git pull origin main

# Option 2: Rebase on remote
git pull --rebase origin main

# If conflicts occur, resolve and continue
git rebase --continue

# Option 3: Force push (if you're certain)
git push --force-with-lease origin main
```

### 15. Fix Large File Preventing Push

```bash
# Scenario: Accidentally committed large file, can't push

# Find large files
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort --numeric-sort --key=2 | \
  tail -n 10

# Remove large file from history
git filter-branch -f --index-filter \
  "git rm -rf --cached --ignore-unmatch path/to/large-file.zip" HEAD

# Or use BFG
java -jar bfg.jar --strip-blobs-bigger-than 50M

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force-with-lease origin main

# Use Git LFS for large files going forward
git lfs install
git lfs track "*.zip"
git add .gitattributes
```

## Explanation

**Prevention Tips:**
- Always pull before starting work
- Use feature branches for all changes
- Commit frequently with meaningful messages
- Never force push to shared branches without communication
- Use `.gitignore` to prevent committing sensitive files
- Run `git status` before committing
- Create backup branches before risky operations

**Recovery Tools:**
- **git reflog**: Shows all HEAD movements, essential for recovery
- **git reset**: Moves HEAD, careful with `--hard` flag
- **git revert**: Safe way to undo, creates new commit
- **git cherry-pick**: Apply specific commits from anywhere
- **git rebase**: Rewrite history, use with caution
- **BFG Repo-Cleaner**: Fast way to clean repository history

**Safety Guidelines:**
- Use `--force-with-lease` instead of `--force` for safer force pushes
- Always check `git status` before operations
- Test risky commands on a backup branch first
- Use `--dry-run` flag when available
- Keep local backups before history rewrites
- Communicate with team before force pushing shared branches

**Common Patterns:**
- `git reflog` is your friend for recovery
- `--amend` for quick fixes to last commit
- `rebase -i` for cleaning up commit history
- `cherry-pick` for selective commit application
- `reset --soft` to uncommit but keep changes
