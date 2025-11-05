# Workflow Discovery Implementation Plan

## Executive Summary

This document provides a comprehensive plan for implementing workflow discovery in Rust for the Orchestr8 MCP server. The system will scan the `/commands/` directory, extract YAML frontmatter metadata, and expose workflows via MCP tools similar to agent discovery.

**Status:** 20 existing workflows found in `/Users/seth/Projects/orchestr8/commands/`

---

## 1. Discovered Workflows (20 Total)

| Filename | Prompt Name | Purpose |
|----------|------------|---------|
| add-feature.md | add_feature | Autonomous feature development lifecycle |
| build-ml-pipeline.md | build_ml_pipeline | ML pipeline creation and deployment |
| create-agent.md | create_agent | Agent creation with role definition |
| create-plugin.md | create_plugin | Plugin development and integration |
| create-skill.md | create_skill | Reusable skill pattern creation |
| create-workflow.md | create_workflow | Workflow design and orchestration |
| deploy.md | deploy | Safe production deployment |
| fix-bug.md | fix_bug | Bug fix with regression testing |
| modernize-legacy.md | modernize_legacy | Legacy system modernization |
| new-project.md | new_project | Complete project creation |
| optimize-costs.md | optimize_costs | Infrastructure cost optimization |
| optimize-performance.md | optimize_performance | Performance optimization |
| refactor.md | refactor | Code refactoring with validation |
| review-architecture.md | review_architecture | Architecture review and validation |
| review-code.md | review_code | Multi-stage code review |
| review-pr.md | review_pr | Pull request review workflow |
| security-audit.md | security_audit | Security auditing and compliance |
| setup-cicd.md | setup_cicd | CI/CD pipeline setup |
| setup-monitoring.md | setup_monitoring | Monitoring infrastructure setup |
| test-web-ui.md | test_web_ui | Web UI testing and automation |

---

## 2. Frontmatter Specification

### Current State
Workflow files currently **DO NOT** have YAML frontmatter. This is a future enhancement specified in `/Users/seth/Projects/orchestr8/CLAUDE.md` (lines 93-99).

### Specification (from CLAUDE.md)

```yaml
---
description: Brief description of what this workflow does
argument-hint: "[argument-description]"  # Optional
---
```

### Example Implementation
```markdown
---
description: Implement complete feature from analysis to deployment
argument-hint: "[feature-description]"
---

# Add Feature Workflow

[workflow content...]
```

### Parsing Requirements
- YAML frontmatter must be between `---` delimiters at file start
- `description` field: **required**, string, <200 chars recommended
- `argument-hint` field: **optional**, string, describes expected arguments
- If missing: log warning, use defaults (empty string)

---

## 3. Scanning Algorithm

### High-Level Flow

```
1. Initialize
   └─ Set commands_dir = {root}/commands/
   └─ Create cache = LRU(1000 entries, 5min TTL)

2. Discovery
   ├─ glob::glob("commands/**/*.md")
   ├─ For each file:
   │  ├─ Extract filename stem
   │  ├─ Read file content
   │  ├─ Extract --- delimited section
   │  ├─ Parse YAML frontmatter
   │  ├─ Cache metadata
   │  └─ Handle errors gracefully
   └─ Return Vec<WorkflowMetadata>

3. Naming Convention
   ├─ Input:  "add-feature.md"
   ├─ Stem:   "add-feature"
   ├─ Rule:   kebab-case → snake_case
   └─ Output: "add_feature"

4. Caching
   ├─ Key: filename stem (e.g., "add-feature")
   ├─ TTL: 5 minutes (default)
   ├─ Invalidation: on file mtime change
   ├─ Cold load: <10ms
   └─ Warm cache: <1ms
```

### Pseudocode

```rust
pub async fn discover_workflows(commands_dir: &Path, cache: &QueryCache)
    -> Result<DiscoveryResult>
{
    // Check cache first
    if let Some(cached) = cache.get("workflow_discovery")? {
        return Ok(cached);
    }

    let mut workflows = Vec::new();
    let mut errors = Vec::new();

    // Scan directory for *.md files
    let pattern = commands_dir.join("**/*.md").to_string_lossy().to_string();

    for entry in glob::glob(&pattern)? {
        match entry {
            Ok(path) => {
                match parse_workflow_file(&path) {
                    Ok(workflow) => workflows.push(workflow),
                    Err(e) => {
                        errors.push(DiscoveryError {
                            file_path: path.display().to_string(),
                            error_type: e.error_type,
                            message: e.message,
                            severity: ErrorSeverity::Warning,
                        });
                    }
                }
            }
            Err(e) => errors.push(/* glob error */),
        }
    }

    let result = DiscoveryResult {
        workflows,
        total_count: workflows.len(),
        errors,
        load_time_ms: elapsed.as_secs_f64() * 1000.0,
    };

    // Cache for 5 minutes
    cache.insert("workflow_discovery", &result, Duration::from_secs(300))?;

    Ok(result)
}

fn parse_workflow_file(path: &Path) -> Result<WorkflowMetadata> {
    let content = fs::read_to_string(path)?;

    // Extract frontmatter
    let frontmatter = extract_frontmatter(&content)
        .unwrap_or_else(|_| String::new());

    // Parse YAML
    let metadata = if frontmatter.is_empty() {
        WorkflowMetadata {
            description: String::new(),
            argument_hint: None,
        }
    } else {
        serde_yaml::from_str(&frontmatter)?
    };

    // Convert filename to prompt name
    let stem = path.file_stem()
        .and_then(|s| s.to_str())
        .ok_or(anyhow::anyhow!("Invalid filename"))?;

    let prompt_name = kebab_to_snake(stem);

    Ok(WorkflowMetadata {
        name: stem.to_string(),
        prompt_name,
        description: metadata.description,
        argument_hint: metadata.argument_hint,
        file_path: path.display().to_string(),
        discovered_at: SystemTime::now(),
    })
}

fn extract_frontmatter(content: &str) -> Result<String> {
    let lines: Vec<&str> = content.lines().collect();

    let mut start = None;
    let mut end = None;

    for (i, line) in lines.iter().enumerate() {
        if line.trim() == "---" {
            if start.is_none() {
                start = Some(i);
            } else if end.is_none() {
                end = Some(i);
                break;
            }
        }
    }

    match (start, end) {
        (Some(s), Some(e)) if s < e => {
            Ok(lines[s+1..e].join("\n"))
        }
        _ => Err(anyhow::anyhow!("No frontmatter found")),
    }
}

fn kebab_to_snake(s: &str) -> String {
    s.replace('-', "_")
}
```

---

## 4. Naming Convention

### Rule
**Kebab-case filename (without .md) → snake_case prompt name**

### Algorithm
```
1. Extract filename stem (remove .md)
   Example: "add-feature.md" → "add-feature"

2. Replace all hyphens with underscores
   Example: "add-feature" → "add_feature"

3. Convert to lowercase (already lowercase, redundant)
   Example: "add_feature" → "add_feature"

4. Use with / prefix in slash commands
   Example: /add_feature
```

### Examples
| Filename | Prompt Name | Slash Command |
|----------|------------|---------------|
| add-feature.md | add_feature | /add_feature |
| create-workflow.md | create_workflow | /create_workflow |
| review-pr.md | review_pr | /review_pr |
| setup-cicd.md | setup_cicd | /setup_cicd |
| test-web-ui.md | test_web_ui | /test_web_ui |
| optimize-performance.md | optimize_performance | /optimize_performance |
| build-ml-pipeline.md | build_ml_pipeline | /build_ml_pipeline |

### Special Cases
- **Abbreviations**: Keep as-is (PR → pr, UI → ui, ML → ml, CI/CD → cicd)
- **Numbers**: If present, preserve (workflow2.md → workflow2)
- **Unicode**: Use normalization if present (rare)

---

## 5. Error Handling

### Error Cases & Recovery Strategies

| Error Type | Cause | Handling | Recovery |
|-----------|-------|----------|----------|
| **Directory Not Found** | commands/ missing | Log info, return empty list | Not critical - some setups may not have workflows |
| **File System Error** | Permission denied, disk error | Log error, skip file | Continue scanning other files |
| **Frontmatter Parse Error** | Malformed YAML | Log warning with filename | Use defaults (empty description) |
| **Missing Required Field** | 'description' key absent | Log warning | Use empty string default |
| **File Too Large** | Unlikely for text files | Log warning, skip | User should fix |
| **Unicode Issues** | Invalid UTF-8 in filename | Log warning, use lossy conversion | User should fix encoding |
| **Permission Denied** | File not readable | Log warning, skip | User should fix permissions (chmod +r) |
| **Duplicate Names** | Two files with same prompt name | Log warning, keep first | User should rename conflicting files |

### Error Logging
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct DiscoveryError {
    pub file_path: String,
    pub error_type: String,  // e.g., "parse_error", "missing_field"
    pub message: String,      // Human-readable message
    pub severity: ErrorSeverity,  // Info, Warning, Error
}

enum ErrorSeverity {
    Info,
    Warning,
    Error,
}
```

### Example Error Log
```json
{
  "file_path": "/commands/future-workflow.md",
  "error_type": "parse_error",
  "message": "Failed to parse YAML frontmatter: expected mapping",
  "severity": "Warning"
}
```

---

## 6. Data Structures

### WorkflowMetadata
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowMetadata {
    pub name: String,                    // "add-feature" (filename stem)
    pub prompt_name: String,             // "add_feature" (slash command name)
    pub description: String,             // From frontmatter
    pub argument_hint: Option<String>,   // Optional from frontmatter
    pub file_path: String,               // Absolute path
    pub discovered_at: SystemTime,       // When loaded
    pub file_size: u64,                  // For diagnostics
    pub cache_key: String,               // Hash for deduplication
}
```

### DiscoveryResult
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryResult {
    pub workflows: Vec<WorkflowMetadata>,
    pub total_count: usize,
    pub load_time_ms: f64,
    pub errors: Vec<DiscoveryError>,
    pub cache_hits: usize,
    pub cache_misses: usize,
}
```

### FrontmatterMetadata
```rust
#[derive(Debug, Deserialize)]
struct WorkflowFrontmatter {
    description: String,
    #[serde(default)]
    #[serde(rename = "argument-hint")]
    argument_hint: Option<String>,
}
```

---

## 7. Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Cold load (all 20 workflows) | <100ms | First discovery |
| Per-workflow parse time | <5ms | Individual file |
| Warm cache hit | <1ms | Within TTL |
| Cache TTL | 5 minutes | Configurable |
| Memory usage | <10MB | All metadata cached |
| Maximum cache entries | 1000 | LRU with TTL |
| Maximum definition cache | 20 | Separate from query cache |

### Performance Profile
```
Startup: Load metadata for all workflows
    - File system scan:     ~20-30ms
    - Glob pattern match:   ~10-20ms
    - YAML parsing x20:     ~30-50ms
    - Total:                ~80-100ms ✓

Subsequent queries (within TTL):
    - Cache lookup:         <1ms ✓
    - Return cached result: <1ms ✓
    - Total:                <2ms ✓

Cache invalidation (file mtime change):
    - Detect change:        <5ms
    - Reload single file:   <5ms
    - Update cache:         <1ms
    - Total:                ~10ms ✓
```

---

## 8. Integration with MCP Server

### Module Organization
```
orchestr8-bin/src/
├── main.rs              (existing - stdio loop)
├── agents.rs            (existing - agent discovery)
├── workflows.rs         (NEW - workflow discovery)
├── mcp.rs              (existing - tool handlers)
├── db.rs               (existing - DuckDB)
├── cache.rs            (existing - query cache)
└── queries.rs          (existing - SQL queries)
```

### New MCP Tool: `discover_workflows`

```json
{
  "name": "discover_workflows",
  "description": "Discover and search orchestration workflows",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Optional search query (keywords, prompt name)"
      }
    },
    "required": []
  }
}
```

### Tool Handler in mcp.rs
```rust
"discover_workflows" => {
    let query = params.get("query").and_then(|v| v.as_str());
    self.discover_workflows(query).await
}
```

### Integration Points
1. **Handler in McpHandler struct**: Add workflow discovery methods
2. **Database schema**: Add workflows table (optional, for complex queries)
3. **Cache**: Reuse existing QueryCache pattern
4. **Queries**: Add workflow search SQL (optional)

---

## 9. Implementation Checklist

### Phase 1: Core Discovery
- [ ] Create `workflows.rs` module
- [ ] Implement `WorkflowMetadata` struct
- [ ] Implement frontmatter extraction logic
- [ ] Implement YAML parsing
- [ ] Implement kebab→snake conversion
- [ ] Add file system scanning with glob

### Phase 2: Caching & Performance
- [ ] Integrate with existing QueryCache
- [ ] Add file mtime tracking for invalidation
- [ ] Implement warm cache hits
- [ ] Add performance metrics/logging
- [ ] Test cold and warm load times

### Phase 3: Error Handling
- [ ] Handle all error cases (see section 5)
- [ ] Implement error logging with severity levels
- [ ] Add duplicate detection
- [ ] Graceful degradation for malformed files

### Phase 4: MCP Integration
- [ ] Add `discover_workflows` handler to mcp.rs
- [ ] Implement query parameter search
- [ ] Add response formatting
- [ ] Wire up to stdio loop

### Phase 5: Testing
- [ ] Unit tests for frontmatter extraction
- [ ] Unit tests for naming conversion
- [ ] Integration tests with actual workflow files
- [ ] Error case testing
- [ ] Performance benchmarking
- [ ] Cache invalidation testing

### Phase 6: Documentation
- [ ] Add comments to source code
- [ ] Update MCP server documentation
- [ ] Document new discovery_workflows tool
- [ ] Add examples to README

---

## 10. Database Integration (Optional)

### Workflows Table (if database indexing desired)
```sql
CREATE TABLE workflows (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    prompt_name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    argument_hint TEXT,
    file_path VARCHAR NOT NULL,
    file_mtime TIMESTAMP,
    discovered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflows_name ON workflows(name);
CREATE INDEX idx_workflows_prompt_name ON workflows(prompt_name);
CREATE FULLTEXT INDEX idx_workflows_description ON workflows(description);
```

### Query Examples
```sql
-- Find by exact name
SELECT * FROM workflows WHERE name = 'add-feature';

-- Search by keyword
SELECT * FROM workflows WHERE description LIKE '%deployment%';

-- List all with paginate
SELECT * FROM workflows ORDER BY name LIMIT 20 OFFSET 0;

-- Count total
SELECT COUNT(*) FROM workflows;
```

**Note**: Database storage is optional. Metadata-only in-memory caching is sufficient for 20 workflows.

---

## 11. Future Enhancements

1. **Metadata Versioning**: Track workflow versions across releases
2. **Marketplace Integration**: Publish workflow metadata to marketplace
3. **Dependency Tracking**: Map workflows to required agents
4. **Execution History**: Track workflow usage statistics
5. **Workflow Validation**: Verify workflows have required sections
6. **Auto-Generation**: Generate frontmatter from workflow content
7. **Multi-Language**: Support workflows in different languages
8. **Workflow Composition**: Workflows calling other workflows
9. **Conditional Execution**: Workflows with conditional phases
10. **Workflow Templates**: Reusable workflow patterns

---

## 12. Summary

### Key Findings
- **20 workflows** currently exist in `/commands/` directory
- **Frontmatter specification** exists but not yet implemented
- **Naming convention** is clear: kebab-case filenames → snake_case prompt names
- **Scanning algorithm** follows proven agent discovery pattern
- **Error handling** is comprehensive and graceful

### Implementation Approach
1. Create `workflows.rs` module in MCP server
2. Reuse existing cache and glob patterns from agent discovery
3. Parse simple YAML frontmatter (2 fields)
4. Expose via new `discover_workflows` MCP tool
5. Target <100ms cold load, <1ms warm cache

### Effort Estimate
- **Core implementation**: 2-3 hours
- **Error handling**: 1-2 hours
- **Testing**: 2-3 hours
- **Integration**: 1 hour
- **Total**: 6-9 hours

### Files to Create/Modify
- Create: `workflows.rs` (new module)
- Modify: `mcp.rs` (add handler)
- Modify: `main.rs` (initialize workflows)
- Modify: `Cargo.toml` (if new dependencies needed - likely none)

---

## Appendix: Full Implementation Plan JSON

See `WORKFLOW_DISCOVERY_PLAN.json` for complete structured data including:
- All 20 discovered workflows with descriptions
- Sample frontmatter specification
- Detailed scanning algorithm pseudocode
- Error cases with handling strategies
- Data structure definitions
- Validation checklist

