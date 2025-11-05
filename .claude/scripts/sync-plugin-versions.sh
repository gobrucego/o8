#!/bin/bash

##############################################################################
# Sync Plugin Versions
#
# Purpose: Automatically synchronize version across all plugin.json files
#
# This script ensures all plugins stay synchronized with the primary version
# defined in .claude/VERSION. It updates:
# - .claude/plugin.json (main plugin)
# - plugins/*/. claude-plugin/plugin.json (all 18 subplugins)
# - .claude-plugin/marketplace.json (marketplace metadata)
#
# Usage:
#   ./sync-plugin-versions.sh              # Use version from .claude/VERSION
#   ./sync-plugin-versions.sh 4.3.0        # Manually specify version
#
# Returns:
#   0 - Success
#   1 - Error (version not provided or files not found)
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from argument or .claude/VERSION file
if [ -z "$1" ]; then
  if [ ! -f ".claude/VERSION" ]; then
    echo -e "${RED}❌ Error: .claude/VERSION file not found${NC}"
    echo "Usage: $0 [version]"
    exit 1
  fi
  VERSION=$(cat .claude/VERSION | tr -d '[:space:]')
else
  VERSION="$1"
fi

# Validate version format (semantic versioning)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}❌ Error: Invalid version format: $VERSION${NC}"
  echo "Expected format: MAJOR.MINOR.PATCH (e.g., 4.2.0)"
  exit 1
fi

echo -e "${YELLOW}🔄 Synchronizing plugin versions to $VERSION${NC}"

# Track updated files
UPDATED_FILES=0
FAILED_FILES=0

# Update main plugin.json
echo "Updating .claude/plugin.json..."
if sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/g" .claude/plugin.json; then
  echo -e "${GREEN}✓ Updated .claude/plugin.json${NC}"
  ((UPDATED_FILES++))
else
  echo -e "${RED}✗ Failed to update .claude/plugin.json${NC}"
  ((FAILED_FILES++))
fi

# Update all plugin.json files
echo "Updating plugins..."
for plugin_file in plugins/*/.claude-plugin/plugin.json; do
  if [ -f "$plugin_file" ]; then
    plugin_name=$(basename $(dirname $(dirname "$plugin_file")))
    if sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/g" "$plugin_file"; then
      echo -e "${GREEN}✓ Updated $plugin_name${NC}"
      ((UPDATED_FILES++))
    else
      echo -e "${RED}✗ Failed to update $plugin_name${NC}"
      ((FAILED_FILES++))
    fi
  fi
done

# Update marketplace.json metadata version
if [ -f ".claude-plugin/marketplace.json" ]; then
  echo "Updating .claude-plugin/marketplace.json..."
  # Update both metadata.version and plugins[0].version fields
  if sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/g" .claude-plugin/marketplace.json; then
    echo -e "${GREEN}✓ Updated .claude-plugin/marketplace.json${NC}"
    ((UPDATED_FILES++))
  else
    echo -e "${RED}✗ Failed to update .claude-plugin/marketplace.json${NC}"
    ((FAILED_FILES++))
  fi
fi

# Also update .claude/VERSION to ensure consistency
if [ "$VERSION" != "$(cat .claude/VERSION | tr -d '[:space:]')" ]; then
  echo "Updating .claude/VERSION..."
  echo "$VERSION" > .claude/VERSION
  echo -e "${GREEN}✓ Updated .claude/VERSION${NC}"
  ((UPDATED_FILES++))
fi

# Summary
echo ""
echo -e "${GREEN}✅ Version sync complete!${NC}"
echo -e "Updated files: ${GREEN}$UPDATED_FILES${NC}"
if [ $FAILED_FILES -gt 0 ]; then
  echo -e "Failed files: ${RED}$FAILED_FILES${NC}"
  exit 1
else
  echo -e "Failed files: ${GREEN}0${NC}"

  # Show what changed
  echo ""
  echo "Changed files:"
  git diff --name-only

  echo ""
  echo "Verification:"
  echo "  All versions are now: $VERSION"
  echo ""
  echo "Next steps:"
  echo "  1. Review changes with: git diff"
  echo "  2. Commit with: git add . && git commit -m 'chore: sync versions to $VERSION'"
  echo "  3. Tag release with: git tag -a v$VERSION -m 'Release v$VERSION'"
  echo "  4. Push with: git push origin main && git push origin v$VERSION"
fi
