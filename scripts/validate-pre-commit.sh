#!/bin/bash
# Pre-commit validation script
# Run this before committing to ensure all CI checks will pass

set -e

echo "🔍 Running pre-commit validation checks..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Parse command line arguments
RUN_FULL_CI=false
SKIP_ACT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --full)
      RUN_FULL_CI=true
      shift
      ;;
    --skip-act)
      SKIP_ACT=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --full      Run full CI validation with act (slower but comprehensive)"
      echo "  --skip-act  Skip act-based CI tests (faster, local checks only)"
      echo "  --help      Show this help message"
      echo ""
      echo "Default: Runs fast local checks only"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Validating plugin.json structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check required fields in plugin.json
required_fields=("name" "version" "description" "author" "license" "repository")

for field in "${required_fields[@]}"; do
  if ! jq -e ".$field" plugins/orchestr8/.claude-plugin/plugin.json > /dev/null 2>&1; then
    echo -e "${RED}✗ Missing required field in plugin.json: $field${NC}"
    FAILURES=$((FAILURES + 1))
  else
    echo -e "${GREEN}✓${NC} Field '$field' present"
  fi
done

# Validate repository field is a string
REPO_TYPE=$(jq -r '.repository | type' plugins/orchestr8/.claude-plugin/plugin.json)
if [ "$REPO_TYPE" != "string" ]; then
  echo -e "${RED}✗ repository field must be a string, got: $REPO_TYPE${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} repository field is a string"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Validating marketplace.json structure..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! jq -e '.name' .claude-plugin/marketplace.json > /dev/null 2>&1; then
  echo -e "${RED}✗ Missing 'name' field in marketplace.json${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} name field present"
fi

if ! jq -e '.version' .claude-plugin/marketplace.json > /dev/null 2>&1; then
  echo -e "${RED}✗ Missing 'version' field in marketplace.json${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} version field present"
fi

if ! jq -e '.plugins[0]' .claude-plugin/marketplace.json > /dev/null 2>&1; then
  echo -e "${RED}✗ Missing plugins array in marketplace.json${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} plugins array present"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Validating version consistency..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VERSION_FILE=$(cat VERSION | tr -d '[:space:]')
PACKAGE_VERSION=$(jq -r '.version' plugins/orchestr8/package.json)
PLUGIN_VERSION=$(jq -r '.version' plugins/orchestr8/.claude-plugin/plugin.json)
MARKETPLACE_VERSION=$(jq -r '.version' .claude-plugin/marketplace.json)

echo "VERSION file:       $VERSION_FILE"
echo "package.json:       $PACKAGE_VERSION"
echo "plugin.json:        $PLUGIN_VERSION"
echo "marketplace.json:   $MARKETPLACE_VERSION"
echo ""

if [ "$VERSION_FILE" != "$PACKAGE_VERSION" ]; then
  echo -e "${RED}✗ Version mismatch between VERSION and package.json${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} VERSION and package.json match"
fi

if [ "$VERSION_FILE" != "$PLUGIN_VERSION" ]; then
  echo -e "${RED}✗ Version mismatch between VERSION and plugin.json${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} VERSION and plugin.json match"
fi

if [ "$VERSION_FILE" != "$MARKETPLACE_VERSION" ]; then
  echo -e "${RED}✗ Version mismatch between VERSION and marketplace.json${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} VERSION and marketplace.json match"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Validating semantic versioning..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! echo "$VERSION_FILE" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$'; then
  echo -e "${RED}✗ Version '$VERSION_FILE' does not follow semantic versioning${NC}"
  FAILURES=$((FAILURES + 1))
else
  echo -e "${GREEN}✓${NC} Version follows semantic versioning: $VERSION_FILE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Checking required files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

required_files=(
  "VERSION"
  "CHANGELOG.md"
  "README.md"
  "plugins/orchestr8/.claude-plugin/plugin.json"
  "plugins/orchestr8/package.json"
  ".claude-plugin/marketplace.json"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}✗ Missing required file: $file${NC}"
    FAILURES=$((FAILURES + 1))
  else
    echo -e "${GREEN}✓${NC} $file exists"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Checking CHANGELOG for current version..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! grep -q "## \[$VERSION_FILE\]" CHANGELOG.md; then
  echo -e "${YELLOW}⚠ CHANGELOG.md missing entry for version $VERSION_FILE${NC}"
  echo "  This is required for releases but may be okay for non-release commits."
else
  echo -e "${GREEN}✓${NC} CHANGELOG has entry for version $VERSION_FILE"
fi

# Check if we should run full CI with act
if [ "$RUN_FULL_CI" = true ] && [ "$SKIP_ACT" = false ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "7️⃣  Running full CI validation with act..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Check if act is installed
  if ! command -v act &> /dev/null; then
    echo -e "${RED}✗ 'act' is not installed${NC}"
    echo "  Install with: brew install act"
    echo "  Or skip act tests with: $0 --skip-act"
    FAILURES=$((FAILURES + 1))
  else
    echo -e "${BLUE}Running validate-metadata job...${NC}"
    echo ""

    # Run validate-metadata job
    if act -j validate-metadata \
        --container-architecture linux/amd64 \
        -P ubuntu-latest=catthehacker/ubuntu:act-latest \
        --quiet 2>&1 | grep -E "(Success|Failed|Error)"; then
      echo -e "${GREEN}✓${NC} validate-metadata job passed"
    else
      echo -e "${RED}✗ validate-metadata job failed${NC}"
      FAILURES=$((FAILURES + 1))
    fi

    echo ""
    echo -e "${BLUE}Running validate-versions job...${NC}"
    echo ""

    # Run validate-versions job
    if act -j validate-versions \
        --container-architecture linux/amd64 \
        -P ubuntu-latest=catthehacker/ubuntu:act-latest \
        --quiet 2>&1 | grep -E "(Success|Failed|Error)"; then
      echo -e "${GREEN}✓${NC} validate-versions job passed"
    else
      echo -e "${RED}✗ validate-versions job failed${NC}"
      FAILURES=$((FAILURES + 1))
    fi

    echo ""
    echo -e "${BLUE}Running validate-structure job...${NC}"
    echo ""

    # Run validate-structure job
    if act -j validate-structure \
        --container-architecture linux/amd64 \
        -P ubuntu-latest=catthehacker/ubuntu:act-latest \
        --quiet 2>&1 | grep -E "(Success|Failed|Error)"; then
      echo -e "${GREEN}✓${NC} validate-structure job passed"
    else
      echo -e "${RED}✗ validate-structure job failed${NC}"
      FAILURES=$((FAILURES + 1))
    fi
  fi
elif [ "$RUN_FULL_CI" = true ] && [ "$SKIP_ACT" = true ]; then
  echo ""
  echo -e "${YELLOW}⚠ Full CI requested but act tests skipped${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Validation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All validation checks passed!${NC}"
  echo ""
  if [ "$RUN_FULL_CI" = true ]; then
    echo "Safe to commit and push. Full CI validation completed successfully."
  else
    echo "Safe to commit and push. Local checks passed."
    echo ""
    echo -e "${BLUE}💡 Tip: Run '$0 --full' to test with full CI validation (slower)${NC}"
  fi
  exit 0
else
  echo -e "${RED}❌ $FAILURES validation check(s) failed!${NC}"
  echo ""
  echo "Please fix the errors above before committing."
  exit 1
fi
