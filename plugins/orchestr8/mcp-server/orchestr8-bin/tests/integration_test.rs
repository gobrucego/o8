/*!
 * Integration tests for orchestr8-bin MCP server
 */

use serde_json::{json, Value};
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::time::Duration;

#[test]
fn test_mcp_initialize() {
    // Use env! macro to get compile-time manifest dir, then walk up to repo root
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let cargo_dir = std::path::PathBuf::from(manifest_dir);

    // Walk up: orchestr8-bin -> mcp-server -> orchestr8 -> plugins -> repo_root
    let repo_root = cargo_dir
        .parent()     // mcp-server
        .and_then(|p| p.parent())     // orchestr8
        .and_then(|p| p.parent())     // plugins
        .and_then(|p| p.parent())     // repo root
        .expect("Failed to find repo root");

    let root = repo_root.to_string_lossy().to_string();
    let agent_dir = repo_root
        .join("plugins/orchestr8/agent-definitions")
        .to_string_lossy()
        .to_string();

    let binary_path = cargo_dir
        .join("target/release/orchestr8-bin")
        .to_string_lossy()
        .to_string();

    let mut child = Command::new(&binary_path)
        .arg("--root")
        .arg(&root)
        .arg("--agent-dir")
        .arg(&agent_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start server");

    // Give server time to initialize
    std::thread::sleep(Duration::from_millis(500));

    let stdin = child.stdin.as_mut().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let reader = BufReader::new(stdout);

    // Send initialize request
    let request = json!({
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {},
        "id": 1
    });

    writeln!(stdin, "{}", request.to_string()).expect("Failed to write request");
    stdin.flush().expect("Failed to flush");

    // Give server time to respond
    std::thread::sleep(Duration::from_millis(200));

    // Read response
    let mut lines = reader.lines();
    match lines.next() {
        Some(Ok(line)) => {
            if line.is_empty() {
                eprintln!("ERROR: Received empty line from server");
                eprintln!("This may indicate the server encountered an error during initialization");
                panic!("No response received - empty line");
            }
            let response: Value = serde_json::from_str(&line).expect("Failed to parse response");

            assert_eq!(response["jsonrpc"], "2.0");
            assert_eq!(response["id"], 1);
            assert!(response["result"].is_object());
            assert_eq!(response["result"]["serverInfo"]["name"], "orchestr8-mcp-server");
        }
        Some(Err(e)) => panic!("Failed to read response: {}", e),
        None => panic!("No response received from server"),
    }

    let _ = child.kill();
}

#[test]
fn test_mcp_agent_query() {
    // Use env! macro to get compile-time manifest dir, then walk up to repo root
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let cargo_dir = std::path::PathBuf::from(manifest_dir);

    // Walk up: orchestr8-bin -> mcp-server -> orchestr8 -> plugins -> repo_root
    let repo_root = cargo_dir
        .parent()     // mcp-server
        .and_then(|p| p.parent())     // orchestr8
        .and_then(|p| p.parent())     // plugins
        .and_then(|p| p.parent())     // repo root
        .expect("Failed to find repo root");

    let root = repo_root.to_string_lossy().to_string();
    let agent_dir = repo_root
        .join("plugins/orchestr8/agent-definitions")
        .to_string_lossy()
        .to_string();

    let binary_path = cargo_dir
        .join("target/release/orchestr8-bin")
        .to_string_lossy()
        .to_string();

    let mut child = Command::new(&binary_path)
        .arg("--root")
        .arg(&root)
        .arg("--agent-dir")
        .arg(&agent_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start server");

    // Give server time to initialize
    std::thread::sleep(Duration::from_millis(500));

    let stdin = child.stdin.as_mut().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let reader = BufReader::new(stdout);

    // Send query request
    let request = json!({
        "jsonrpc": "2.0",
        "method": "agents/query",
        "params": {
            "context": "react",
            "limit": 5
        },
        "id": 2
    });

    writeln!(stdin, "{}", request.to_string()).expect("Failed to write request");
    stdin.flush().expect("Failed to flush");

    // Give server time to respond
    std::thread::sleep(Duration::from_millis(200));

    // Read response
    let mut lines = reader.lines();
    if let Some(Ok(line)) = lines.next() {
        let response: Value = serde_json::from_str(&line).expect("Failed to parse response");

        assert_eq!(response["jsonrpc"], "2.0");
        assert_eq!(response["id"], 2);
        assert!(response["result"].is_object());
        assert!(response["result"]["agents"].is_array());
    } else {
        panic!("No response received");
    }

    let _ = child.kill();
}

#[test]
fn test_mcp_health() {
    // Use env! macro to get compile-time manifest dir, then walk up to repo root
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    let cargo_dir = std::path::PathBuf::from(manifest_dir);

    // Walk up: orchestr8-bin -> mcp-server -> orchestr8 -> plugins -> repo_root
    let repo_root = cargo_dir
        .parent()     // mcp-server
        .and_then(|p| p.parent())     // orchestr8
        .and_then(|p| p.parent())     // plugins
        .and_then(|p| p.parent())     // repo root
        .expect("Failed to find repo root");

    let root = repo_root.to_string_lossy().to_string();
    let agent_dir = repo_root
        .join("plugins/orchestr8/agent-definitions")
        .to_string_lossy()
        .to_string();

    let binary_path = cargo_dir
        .join("target/release/orchestr8-bin")
        .to_string_lossy()
        .to_string();

    let mut child = Command::new(&binary_path)
        .arg("--root")
        .arg(&root)
        .arg("--agent-dir")
        .arg(&agent_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start server");

    // Give server time to initialize
    std::thread::sleep(Duration::from_millis(500));

    let stdin = child.stdin.as_mut().expect("Failed to open stdin");
    let stdout = child.stdout.take().expect("Failed to open stdout");
    let reader = BufReader::new(stdout);

    // Send health check
    let request = json!({
        "jsonrpc": "2.0",
        "method": "health",
        "params": {},
        "id": 3
    });

    writeln!(stdin, "{}", request.to_string()).expect("Failed to write request");
    stdin.flush().expect("Failed to flush");

    // Give server time to respond
    std::thread::sleep(Duration::from_millis(200));

    // Read response
    let mut lines = reader.lines();
    if let Some(Ok(line)) = lines.next() {
        let response: Value = serde_json::from_str(&line).expect("Failed to parse response");

        assert_eq!(response["jsonrpc"], "2.0");
        assert_eq!(response["id"], 3);
        assert_eq!(response["result"]["status"], "healthy");
        assert!(response["result"]["uptime_ms"].is_number());
        assert!(response["result"]["memory_mb"].is_number());
    } else {
        panic!("No response received");
    }

    let _ = child.kill();
}
