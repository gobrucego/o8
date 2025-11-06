# GitHub Actions Live Issues - Current Failures

**Date:** November 6, 2025
**Status:** CURRENT - Workflows are actively failing
**Latest Failed Run:** v5.8.2 release tag

---

## Active Issue #1: Release Workflow Fails on Tag Push

**Issue:** Release.yml fails when pushing `v5.8.2` tag

**Error Message:**
```
ERROR: Missing agent-definitions directory
Process completed with exit code 1
```

**Root Cause:**
The `validate-release` job in `.github/workflows/release.yml` (lines 137-161) validates for agents/commands at:
```bash
if [ ! -d "agent-definitions" ]; then
  echo "ERROR: Missing agent-definitions directory"
  exit 1
fi
```

But they're actually at:
```
plugins/orchestr8/agent-definitions
plugins/orchestr8/commands
```

**Affected Run:**
- Run ID: 19122204155
- Tag: v5.8.2
- Status: FAILURE
- Job: `Validate Release` → `Run all validation checks`

**Fix Required:**
```yaml
# Lines 137-149 in .github/workflows/release.yml
# WRONG (current):
if [ ! -d "agent-definitions" ]; then
  echo "ERROR: Missing agent-definitions directory"
  exit 1
fi

if [ ! -d "commands" ]; then
  echo "ERROR: Missing commands directory"
  exit 1
fi

AGENT_COUNT=$(find agent-definitions -name "*.md" | wc -l)
WORKFLOW_COUNT=$(find commands -name "*.md" | wc -l)

# CORRECT (should be):
if [ ! -d "plugins/orchestr8/agent-definitions" ]; then
  echo "ERROR: Missing plugins/orchestr8/agent-definitions directory"
  exit 1
fi

if [ ! -d "plugins/orchestr8/commands" ]; then
  echo "ERROR: Missing plugins/orchestr8/commands directory"
  exit 1
fi

AGENT_COUNT=$(find plugins/orchestr8/agent-definitions -name "*.md" | wc -l)
WORKFLOW_COUNT=$(find plugins/orchestr8/commands -name "*.md" | wc -l)
```

Also lines 164-174:
```yaml
find agent-definitions -name "*.md" 2>/dev/null | while read -r file; do

# Should be:
find plugins/orchestr8/agent-definitions -name "*.md" 2>/dev/null | while read -r file; do
```

---

## Workflow Run History

| Run ID | Workflow | Tag | Status | Issue |
|--------|----------|-----|--------|-------|
| 19122204155 | Release | v5.8.2 | ❌ FAILED | agent-definitions path wrong |
| 19122204097 | Release Cross-Platform Binaries | v5.8.2 | ⏳ IN-PROGRESS | Waiting for Release to pass |
| 19122144242 | CI | main | ✅ PASSED | No issues |
| 19110320199 | Release Cross-Platform Binaries | v5.2.0 | ❌ FAILED | Related path issue |
| 19111072983 | Auto Release on Version Change | main | ❌ CANCELLED | Because Release failed |
| 19110370218 | Auto Release on Version Change | main | ❌ CANCELLED | Because Release failed |

---

## Impact

**Immediate:**
- ❌ v5.8.2 release CANNOT be created
- ❌ Binaries CANNOT be built
- ❌ GitHub release page shows no assets

**For Users:**
- ❌ Cannot install v5.8.2 from marketplace
- ❌ post-install hook cannot download binary
- ❌ Binary download in init.sh fails

**Release Blocked:**
When version is bumped to v5.8.2 and pushed, the workflow fails at validation stage, preventing:
1. Release notes extraction
2. GitHub release creation
3. Binary builds for all platforms
4. Checksum generation
5. Release announcement

---

## Other Workflows with Same Issue

### CI.yml
Lines 85, 148, 252 also have wrong paths:
```yaml
agent_count=$(find plugins/orchestr8/agent-definitions -name "*.md" | wc -l | tr -d ' ')
command_count=$(find plugins/orchestr8/commands -name "*.md" | wc -l | tr -d ' ')
```

However, CI workflow runs against `main` branch (after code is merged), so these paths may work depending on structure. **Still should be fixed for consistency.**

---

## Files to Update

1. **`.github/workflows/release.yml`** - CRITICAL
   - Lines 137-161: Fix path validation
   - Line 279: Fix CHANGELOG link path (.claude/CHANGELOG.md → CHANGELOG.md)

2. **`.github/workflows/ci.yml`** - Important
   - Lines 77-93: Fix required_dirs validation
   - Lines 301, 310, 314: Fix security scanning paths

3. **`.github/workflows/pr-checks.yml`** - Important
   - Lines 76-93: Fix path filters
   - Lines 250-294: Fix version file paths

4. **`.github/workflows/auto-release.yml`** - Critical
   - Line 195: Fix Windows build working-directory

---

## Quick Fix Script

```bash
#!/bin/bash
# Quick fix for GitHub Actions path issues

echo "Fixing .github/workflows/release.yml..."
sed -i 's|find agent-definitions -name|find plugins/orchestr8/agent-definitions -name|g' .github/workflows/release.yml
sed -i 's|if \[ ! -d "agent-definitions"|if [ ! -d "plugins/orchestr8/agent-definitions"|g' .github/workflows/release.yml
sed -i 's|if \[ ! -d "commands"|if [ ! -d "plugins/orchestr8/commands"|g' .github/workflows/release.yml
sed -i 's|.claude/CHANGELOG|CHANGELOG|g' .github/workflows/release.yml

echo "Fixing .github/workflows/ci.yml..."
sed -i "s|'agent-definitions/\*\*/\*.md'|'plugins/orchestr8/agent-definitions/**/*.md'|g" .github/workflows/ci.yml
sed -i "s|'commands/\*\*/\*.md'|'plugins/orchestr8/commands/**/*.md'|g" .github/workflows/ci.yml

echo "Fixing .github/workflows/pr-checks.yml..."
sed -i "s|'agent-definitions/\*\*/\*.md'|'plugins/orchestr8/agent-definitions/**/*.md'|g" .github/workflows/pr-checks.yml
sed -i "s|'commands/\*\*/\*.md'|'plugins/orchestr8/commands/**/*.md'|g" .github/workflows/pr-checks.yml
sed -i 's|.claude/VERSION|VERSION|g' .github/workflows/pr-checks.yml
sed -i 's|.claude/plugin.json|plugins/orchestr8/.claude-plugin/plugin.json|g' .github/workflows/pr-checks.yml
sed -i 's|.claude/CHANGELOG|CHANGELOG|g' .github/workflows/pr-checks.yml

echo "Done!"
```

---

## Recommendation

**DO THIS NOW:**
1. Fix release.yml (blocking all releases)
2. Test with a new tag push
3. Fix other workflows
4. Re-run failed workflows

**DO NOT:**
- Push new tags until release.yml is fixed
- Bump VERSION file until release.yml is fixed

---

## Root Cause

All these issues stem from the migration from `.claude/` structure to `plugins/orchestr8/` plugin structure. The GitHub Actions workflows were updated partway but not completely - some still reference old paths.

The CI job passes because it runs on `main` branch after changes are merged, and the directory structure validation might be less strict. But release.yml runs with the committed code and FAILS because it explicitly checks for root-level directories that don't exist.

---

## Confirmation

GitHub Actions run 19122204155 shows the exact error point:

```
Validate Release > Run all validation checks > ERROR: Missing agent-definitions directory
```

This confirms the issue is in `release.yml` lines 137-140 checking for the wrong path.
