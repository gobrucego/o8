#!/usr/bin/env bash
# Session start hook for orchestr8
# Runs when Claude Code starts a new session or resumes an existing session
# Ensures MCP data directory is ready for the Rust MCP server

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MCP_DATA_DIR="$PLUGIN_ROOT/mcp-server/data"
MCP_BINARY="$PLUGIN_ROOT/mcp-server/orchestr8-bin/target/release/orchestr8-bin"

# Create MCP data directory if it doesn't exist
mkdir -p "$MCP_DATA_DIR"

# Check if MCP binary exists
if [ ! -f "$MCP_BINARY" ]; then
    echo "⚠️  Warning: MCP binary not found at $MCP_BINARY"
    exit 0  # Don't fail, MCP will be started by Claude Code's mcpServers registration
fi

# Store MCP paths in environment for Claude Code's use
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    echo "ORCHESTR8_MCP_BINARY=$MCP_BINARY" >> "$CLAUDE_ENV_FILE"
    echo "ORCHESTR8_MCP_DATA_DIR=$MCP_DATA_DIR" >> "$CLAUDE_ENV_FILE"
fi

exit 0
