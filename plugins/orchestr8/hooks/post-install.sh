#!/usr/bin/env bash
# Post-installation hook for orchestr8 plugin
# Automatically runs after plugin installation to download pre-built MCP server binary from GitHub releases

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_BIN_DIR="$PLUGIN_ROOT/mcp-server/orchestr8-bin/target/release"
MCP_BIN_PATH="$MCP_BIN_DIR/orchestr8-bin"
MCP_DATA_DIR="$PLUGIN_ROOT/mcp-server/data"

echo "============================================"
echo "orchestr8 Plugin - Post-Installation Setup"
echo "============================================"
echo ""

# Detect OS and architecture
echo "🔍 Detecting OS and architecture..."
OS=$(uname -s)
ARCH=$(uname -m)

case "$OS" in
  Darwin)
    if [ "$ARCH" = "x86_64" ]; then
      BINARY_NAME="orchestr8-bin-darwin-x86_64"
      ARCHIVE_EXT="tar.gz"
    elif [ "$ARCH" = "arm64" ]; then
      BINARY_NAME="orchestr8-bin-darwin-arm64"
      ARCHIVE_EXT="tar.gz"
    else
      echo "❌ Unsupported macOS architecture: $ARCH"
      exit 1
    fi
    ;;
  Linux)
    if [ "$ARCH" = "x86_64" ]; then
      BINARY_NAME="orchestr8-bin-linux-x86_64"
      ARCHIVE_EXT="tar.gz"
    elif [ "$ARCH" = "aarch64" ]; then
      BINARY_NAME="orchestr8-bin-linux-arm64"
      ARCHIVE_EXT="tar.gz"
    else
      echo "❌ Unsupported Linux architecture: $ARCH"
      exit 1
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    if [ "$ARCH" = "x86_64" ]; then
      BINARY_NAME="orchestr8-bin-windows-x86_64"
      ARCHIVE_EXT="zip"
    else
      echo "❌ Unsupported Windows architecture: $ARCH"
      exit 1
    fi
    ;;
  *)
    echo "❌ Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "   OS: $OS, Architecture: $ARCH"
echo "   Binary: $BINARY_NAME.$ARCHIVE_EXT"

# Download MCP binary from GitHub releases
echo ""
echo "⬇️  Downloading MCP server binary..."

# Create binary directory
mkdir -p "$MCP_BIN_DIR"

# Get latest release version
LATEST_VERSION=$(curl -s https://api.github.com/repos/seth-schultz/orchestr8/releases/latest | grep '"tag_name"' | head -1 | sed 's/.*"v\([^"]*\)".*/\1/')

if [ -z "$LATEST_VERSION" ]; then
  echo "❌ Could not determine latest version from GitHub releases"
  exit 1
fi

echo "   Latest version: v$LATEST_VERSION"

# Download binary
DOWNLOAD_URL="https://github.com/seth-schultz/orchestr8/releases/download/v$LATEST_VERSION/$BINARY_NAME.$ARCHIVE_EXT"

echo "   Downloading from: $DOWNLOAD_URL"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

cd "$TEMP_DIR"
if ! curl -fsSL -o "binary.$ARCHIVE_EXT" "$DOWNLOAD_URL"; then
  echo "❌ Failed to download binary from $DOWNLOAD_URL"
  exit 1
fi

# Extract binary
if [ "$ARCHIVE_EXT" = "tar.gz" ]; then
  tar -xzf "binary.$ARCHIVE_EXT"
elif [ "$ARCHIVE_EXT" = "zip" ]; then
  unzip -q "binary.$ARCHIVE_EXT"
fi

# Move binary to correct location
if [ "$OS" = "MINGW" ] || [ "$OS" = "MSYS" ] || [ "$OS" = "CYGWIN" ]; then
  mv orchestr8-bin.exe "$MCP_BIN_PATH.exe"
else
  mv orchestr8-bin "$MCP_BIN_PATH"
  chmod +x "$MCP_BIN_PATH"
fi

echo "   ✅ MCP server binary installed at: $MCP_BIN_PATH"

# Create MCP data directory
echo ""
echo "📁 Creating MCP data directory..."
mkdir -p "$MCP_DATA_DIR"
echo "   ✅ MCP data directory ready at: $MCP_DATA_DIR"

echo ""
echo "============================================"
echo "✅ orchestr8 Plugin Installation Complete!"
echo "============================================"
echo ""
echo "📚 Next Steps:"
echo "   1. Restart Claude Code to initialize the MCP server"
echo "   2. Test: /add-feature 'Your feature description'"
echo ""
echo "📖 Documentation:"
echo "   - Architecture: $PLUGIN_ROOT/../ARCHITECTURE.md"
echo "   - MCP Server: $PLUGIN_ROOT/mcp-server/orchestr8-bin/README.md"
echo ""
