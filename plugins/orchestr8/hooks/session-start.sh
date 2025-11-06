#!/usr/bin/env bash
# Session start hook for orchestr8
# Runs when Claude Code starts a new session or resumes an existing session
# Ensures MCP binary is downloaded and data directory is ready

set -euo pipefail

# Use CLAUDE_PLUGIN_ROOT if available, otherwise determine from script location
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
    PLUGIN_ROOT="$CLAUDE_PLUGIN_ROOT"
else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

MCP_DATA_DIR="$PLUGIN_ROOT/mcp-server/data"
MCP_BINARY="$PLUGIN_ROOT/mcp-server/orchestr8-bin/target/release/orchestr8-bin"

# Create MCP data directory if it doesn't exist
mkdir -p "$MCP_DATA_DIR"

# Check if MCP binary exists, if not download it
if [ ! -f "$MCP_BINARY" ]; then
    echo "⚠️  MCP binary not found, downloading..."

    # Run post-install hook to download binary
    if [ -f "$PLUGIN_ROOT/hooks/post-install.sh" ]; then
        bash "$PLUGIN_ROOT/hooks/post-install.sh" || {
            echo "❌ Failed to download MCP binary"
            echo "   Please run manually: bash $PLUGIN_ROOT/hooks/post-install.sh"
            exit 1
        }
    else
        echo "❌ Post-install script not found"
        exit 1
    fi

    # Verify binary was downloaded
    if [ ! -f "$MCP_BINARY" ]; then
        echo "❌ MCP binary still not found after download attempt"
        exit 1
    fi

    echo "✅ MCP binary downloaded successfully"
fi

# Store MCP paths in environment for Claude Code's use
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "ORCHESTR8_MCP_BINARY=$MCP_BINARY" >> "$CLAUDE_ENV_FILE"
    echo "ORCHESTR8_MCP_DATA_DIR=$MCP_DATA_DIR" >> "$CLAUDE_ENV_FILE"
fi

exit 0
