# Orchestr8 Release Workflow Guide

## Overview

This document describes the complete automated release workflow for the Orchestr8 project. The workflow is **fully automatic** - releases are triggered simply by updating the VERSION file and pushing to main.

## How Releases Work

### Step 1: Update VERSION and Push

```bash
# Update version
echo "5.6.0" > .claude/VERSION

# Sync all plugin versions (automated)
./.claude/scripts/sync-plugin-versions.sh

# Add CHANGELOG entry (manual)
# ... edit .claude/CHANGELOG.md ...

# Commit and push
git add .
git commit -m "chore: release v5.6.0 - ..."
git push origin main
```

### Step 2: Auto-Release Workflow Triggers

The `.github/workflows/auto-release.yml` workflow is triggered by VERSION file changes:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - '.claude/VERSION'
```

### Step 3: Automatic Job Sequence

#### Job 1: **Detect Version Change** (Detect version change on main)
- Reads `.claude/VERSION` file
- Gets latest release version from GitHub
- Compares versions
- Only proceeds if version changed

**Output:** `version`, `should_release`

#### Job 2: **Create Release Tag** (Create Release Tag)
- Checkouts main branch
- Creates annotated git tag: `v{VERSION}`
- Pushes tag to origin
- Tag push triggers `release.yml` workflow (webhook)

**Output:** Tag v{VERSION} created and pushed

#### Job 3: **Build Binaries** (Build Binaries - Matrix)
- **Runs in parallel on 5 platforms:**
  - macOS x86_64 (on macos-latest)
  - macOS ARM64/M1 (on macos-latest)
  - Linux x86_64 (on ubuntu-latest)
  - Linux ARM64 (on ubuntu-latest with cross)
  - Windows x86_64 (on windows-latest)

- **Each build:**
  1. Checkouts code
  2. Installs Rust toolchain for target
  3. Builds release binary
  4. Creates archive (tar.gz or .zip)
  5. Generates SHA256 checksum
  6. Uploads as artifact

**Output:** Binary archives + checksums for each platform

#### Job 4: **Finalize Release** (Finalize GitHub Release with Binaries)
- Waits for all matrix builds to complete
- Downloads all binary artifacts from matrix
- Verifies SHA256 checksums
- Extracts CHANGELOG section for release notes
- Creates GitHub release with all binaries and checksums

**Output:** Published GitHub release with all platform binaries

#### Job 5: **Release Validation** (release.yml - triggered by tag push)
- Validates VERSION files are synchronized
- Validates Rust binary version matches plugin version
- Validates CHANGELOG has entry
- Validates plugin structure
- Creates GitHub release (if auto-release hasn't)

## Version Synchronization

The workflow validates that **all version sources are synchronized:**

### Files Synchronized by Version Bump:
1. `.claude/VERSION` - Main version source (20 files total synced)
2. `.claude/plugin.json` - Main plugin metadata
3. `plugins/*/plugin.json` - All 18 plugin metadata files
4. `.claude-plugin/marketplace.json` - Marketplace metadata (both version fields)
5. `.claude/mcp-server/orchestr8-bin/Cargo.toml` - Rust binary version

### Pre-Commit Hook Validation

The `.git/hooks/pre-commit` hook validates:
- All `.claude/plugin.json` files match `.claude/VERSION`
- All `plugins/*/plugin.json` files match `.claude/VERSION`
- Rust binary version (Cargo.toml) matches `.claude/VERSION`
- CHANGELOG.md has entry for current version

**Prevention:** Hook prevents commits if versions are mismatched.

### Sync Script

```bash
./.claude/scripts/sync-plugin-versions.sh
```

Automatically syncs all 20+ files to match the version in `.claude/VERSION`.

## Build Matrix Details

### Platform Configuration

| Platform | OS | Target | Build Tool | Archive |
|----------|-------|--------|----------|---------|
| macOS x86_64 | macos-latest | x86_64-apple-darwin | cargo | tar.gz |
| macOS ARM64 | macos-latest | aarch64-apple-darwin | cargo | tar.gz |
| Linux x86_64 | ubuntu-latest | x86_64-unknown-linux-gnu | cargo | tar.gz |
| Linux ARM64 | ubuntu-latest | aarch64-unknown-linux-gnu | cross | tar.gz |
| Windows x86_64 | windows-latest | x86_64-pc-windows-msvc | cargo | .zip |

### Binary Naming Convention

```
orchestr8-bin-{platform}-{version}.{ext}
orchestr8-bin-{platform}-{version}.{ext}.sha256

Examples:
- orchestr8-bin-macos-x86_64-5.5.0.tar.gz
- orchestr8-bin-linux-arm64-5.5.0.tar.gz.sha256
- orchestr8-bin-windows-x86_64-5.5.0.zip
```

## Release Notes

Release notes are automatically extracted from CHANGELOG.md:

```markdown
## [VERSION] - DATE

### Category Name

**Description**
- Feature 1
- Feature 2
```

The text between version headers is used as the release notes.

## Artifacts & Checksums

Each release includes:
- **Binaries**: tar.gz for Unix, .zip for Windows
- **Checksums**: SHA256 checksum for each binary
- **Verification**: All checksums verified before publishing release

### Checksum Verification

Users can verify download integrity:

```bash
# Download binary and checksum
wget https://github.com/seth-schultz/orchestr8/releases/download/v5.5.0/orchestr8-bin-linux-x86_64-5.5.0.tar.gz
wget https://github.com/seth-schultz/orchestr8/releases/download/v5.5.0/orchestr8-bin-linux-x86_64-5.5.0.tar.gz.sha256

# Verify
sha256sum -c orchestr8-bin-linux-x86_64-5.5.0.tar.gz.sha256
```

## Complete Release Flow Diagram

```
VERSION file updated on main branch
          ↓
  push to origin main
          ↓
auto-release.yml triggers (VERSION path filter)
          ↓
┌─────────────────────────────────────────┐
│ 1. Detect Version Change                │
│    - Read .claude/VERSION               │
│    - Get latest release                 │
│    - Compare (should_release=true)      │
└─────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 2. Create Release Tag                   │
│    - Checkout main                      │
│    - git tag v{VERSION}                 │
│    - git push origin v{VERSION}         │
│    (Tag push triggers release.yml)      │
└─────────────────────────────────────────┘
          ↓
   ┌──────────────────────────────────────────┐
   │   3. Build Binaries (Matrix - Parallel)  │
   ├──────────────────────────────────────────┤
   │ [1] macOS x86_64                         │
   │ [2] macOS ARM64                          │
   │ [3] Linux x86_64                         │
   │ [4] Linux ARM64 (cross)                  │
   │ [5] Windows x86_64                       │
   └──────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────┐
│ 4. Finalize Release                     │
│    - Download all 5 binaries            │
│    - Verify checksums                   │
│    - Extract CHANGELOG section          │
│    - Create GitHub release w/ binaries  │
└─────────────────────────────────────────┘
          ↓
   Parallel: release.yml (triggered by tag)
   ├─ Validate versions
   ├─ Validate Rust binary version
   ├─ Validate CHANGELOG
   └─ Publish release
          ↓
✅ Release Complete with all platform binaries
```

## Quality Assurance Checks

### Pre-Commit Hook Checks
- ✅ All version files synchronized
- ✅ Rust binary version matches
- ✅ CHANGELOG entry exists

### Auto-Release Checks
- ✅ VERSION file differs from latest release
- ✅ Git tag created successfully
- ✅ All 5 platform builds complete
- ✅ All checksums verified

### Release.yml Checks
- ✅ All version files consistent
- ✅ Rust binary version matches plugin version
- ✅ CHANGELOG has entry for version
- ✅ Plugin structure valid
- ✅ Agent count matches expected (75)
- ✅ Workflow count matches expected (20)

## Troubleshooting

### Release Doesn't Trigger
- Check that `.claude/VERSION` was actually modified
- Ensure changes were pushed to `main` branch
- Verify path filter in auto-release.yml matches file

### Build Fails on Specific Platform
- Check GitHub Actions logs for platform-specific error
- Most common: Rust toolchain not installed for target
- Solution: auto-release.yml will retry with latest stable toolchain

### Version Mismatch on Commit
- Pre-commit hook prevents commit if versions don't match
- Solution: Run `./. claude/scripts/sync-plugin-versions.sh`
- Or edit files manually to match `.claude/VERSION`

### Release Already Exists
- GitHub release creation fails if release exists
- finalize-release job handles this with fallback: `gh release upload`
- Existing release is updated with new binaries

## Manual Override

If needed, you can manually trigger the release workflow:

```bash
# Create tag manually (not recommended, use VERSION file instead)
git tag -a v5.6.0 -m "Release v5.6.0"
git push origin v5.6.0

# This triggers release.yml directly
```

## Version Bump Checklist

Before bumping version:

- [ ] Update `.claude/VERSION`
- [ ] Run `./.claude/scripts/sync-plugin-versions.sh`
- [ ] Add CHANGELOG entry with new features/fixes
- [ ] Verify pre-commit hook passes
- [ ] Commit and push to main
- [ ] Monitor GitHub Actions for all jobs completing
- [ ] Verify GitHub release published with all binaries

## GitHub Actions Secrets Required

- `GITHUB_TOKEN` - Automatic (provided by GitHub Actions)

No additional secrets required!

## Performance Notes

- **Total release time**: ~10-20 minutes
  - Matrix builds run in parallel (fastest determines total time)
  - Slowest build: Usually Windows (MSVC compilation)
  - macOS ARM64 usually fastest
  - Linux ARM64 uses cross (slight overhead)

- **Build caching**:
  - Cargo dependencies cached per runner OS
  - Subsequent builds much faster if Cargo.lock unchanged

## Files Modified by Release Workflow

### Read-Only:
- `.claude/CHANGELOG.md` - Extracted for release notes

### Written (by auto-release):
- Git tag: `v{VERSION}`
- GitHub release artifact (attached binaries + checksums)

### No File System Changes:
- All artifacts generated in build matrix
- No modifications to local codebase
- Safe to run multiple times

## Next Steps

To test the release workflow:

1. Update `.claude/VERSION` to next version (e.g., 5.6.0)
2. Run sync script: `./.claude/scripts/sync-plugin-versions.sh`
3. Add CHANGELOG entry
4. Commit and push: `git add . && git commit -m "chore: release v5.6.0"` && git push`
5. Monitor GitHub Actions: https://github.com/seth-schultz/orchestr8/actions
6. Verify release published with all 5 platform binaries

---

**Last Updated**: 2025-11-05
**Orchestr8 Version**: 5.5.0+
**Release Workflow Status**: ✅ Production Ready
