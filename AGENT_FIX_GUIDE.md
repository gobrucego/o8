# Agent Fix Guide - Quick Start

Step-by-step guide to fix the 58 agents that need corrections.

---

## Phase 1: Critical Frontmatter Fixes (1-2 hours)

### Fix 1: Frontmatter Name Corruption (3 agents)

**Affected:**
- `infrastructure/code-query.md`
- `meta/agent-architect.md`
- `meta/skill-architect.md`

**How to fix:**

1. Open each file
2. Find the frontmatter (between `---` markers)
3. Fix the `name` field to contain ONLY the agent name

**Example - code-query.md:**

```yaml
# BEFORE (BROKEN):
---
name: code-query
description: JIT context loading agent...
example-agent
model: claude-sonnet-4-5-20250929
...

# AFTER (FIXED):
---
name: code-query
description: JIT context loading agent that provides intelligent code queries from the database with automatic reconciliation. File system is source of truth. Use for loading only relevant code context instead of entire files.
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---
```

**Example - agent-architect.md:**

```yaml
# BEFORE (BROKEN):
---
name: agent-architect
description: Expert in designing Claude Code agents...
technology-specialist
review-specialist
infrastructure-specialist
meta-orchestrator
model: claude-sonnet-4-5-20250929
...

# AFTER (FIXED):
---
name: agent-architect
description: Expert in designing Claude Code agents following established patterns and best practices. Use for creating new specialized agents, determining tool selection, model choice, and documentation structure.
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

---

### Fix 2: Missing Tools Field + Non-Standard Fields (10 agents)

**Affected:**
- `development/ai-ml/langchain-specialist.md`
- `development/ai-ml/llamaindex-specialist.md`
- `development/blockchain/solidity-specialist.md`
- `development/blockchain/web3-specialist.md`
- `development/game-engines/godot-specialist.md`
- `development/game-engines/unity-specialist.md`
- `development/game-engines/unreal-specialist.md`
- `quality/contract-testing-specialist.md`
- `quality/mutation-testing-specialist.md`

**How to fix:**

1. Open each file
2. Remove `categories` and `dependencies` fields
3. Add `tools` field with standard specialist tools
4. Ensure description ends with "Use for..." context

**Example - langchain-specialist.md:**

```yaml
# BEFORE (BROKEN):
---
name: langchain-specialist
description: Expert LangChain developer specializing in LLM chains, agents, RAG systems, memory, and production AI application development
categories: [development, ai-ml, langchain]
dependencies: [python-developer]
model: claude-sonnet-4-5-20250929
---

# AFTER (FIXED):
---
name: langchain-specialist
description: Expert LangChain developer specializing in LLM chains, agents, RAG systems, memory, and production AI application development. Use for building LangChain applications, RAG pipelines, LLM agents, and production AI systems with OpenAI, Anthropic, or open-source models.
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

**Repeat for all 10 agents using this pattern.**

---

## Phase 2: Database Integration Removal (4-6 hours)

### Automated Script Approach

Create a script to remove database integration sections:

```bash
#!/bin/bash

# remove-db-integration.sh

# List of agents to fix (all non-orchestrators with DB code)
AGENTS=(
  "compliance/fedramp-specialist.md"
  "compliance/gdpr-specialist.md"
  "compliance/iso27001-specialist.md"
  "compliance/pci-dss-specialist.md"
  "compliance/soc2-specialist.md"
  "development/architect.md"
  "development/fullstack-developer.md"
  "development/languages/cpp-developer.md"
  "development/languages/csharp-developer.md"
  "development/languages/go-developer.md"
  "development/languages/java-developer.md"
  "development/languages/kotlin-developer.md"
  "development/languages/php-developer.md"
  "development/languages/python-developer.md"
  "development/languages/ruby-developer.md"
  "development/languages/rust-developer.md"
  "development/languages/swift-developer.md"
  "development/languages/typescript-developer.md"
  "devops/cloud/aws-specialist.md"
  "devops/infrastructure/terraform-specialist.md"
  "infrastructure/caching/cdn-specialist.md"
  "infrastructure/caching/redis-cache-specialist.md"
  "infrastructure/cloud/azure-specialist.md"
  "infrastructure/cloud/gcp-specialist.md"
  "infrastructure/databases/mongodb-specialist.md"
  "infrastructure/databases/postgresql-specialist.md"
  "infrastructure/databases/redis-specialist.md"
  "infrastructure/messaging/kafka-specialist.md"
  "infrastructure/messaging/rabbitmq-specialist.md"
  "infrastructure/monitoring/elk-stack-specialist.md"
  "infrastructure/monitoring/prometheus-grafana-specialist.md"
  "infrastructure/search/algolia-specialist.md"
  "infrastructure/search/elasticsearch-specialist.md"
  "infrastructure/sre/observability-specialist.md"
  "infrastructure/sre/sre-specialist.md"
  "quality/code-reviewer.md"
  "quality/contract-testing-specialist.md"
  "quality/debugging/debugger.md"
  "quality/mutation-testing-specialist.md"
  "quality/security-auditor.md"
  "quality/test-engineer.md"
  "quality/testing/load-testing-specialist.md"
  "quality/testing/playwright-specialist.md"
)

for agent in "${AGENTS[@]}"; do
  file=".claude/agents/$agent"

  echo "Processing: $agent"

  # Create backup
  cp "$file" "$file.backup"

  # Remove database integration section
  # This removes from "## Intelligence Database Integration" to next "## " heading
  sed -i.tmp '/^## Intelligence Database Integration$/,/^## [^I]/{
    /^## Intelligence Database Integration$/d
    /^## [^I]/!d
  }' "$file"

  rm "$file.tmp"

  echo "  ✓ Removed database integration section"
done

echo ""
echo "Done! Review changes and delete .backup files if satisfied."
```

**Usage:**
```bash
chmod +x remove-db-integration.sh
./remove-db-integration.sh
```

### Manual Approach (Safer for First Few)

**For each agent:**

1. Open file in editor
2. Find section starting with `## Intelligence Database Integration`
3. Delete everything from that heading until the next `##` heading
4. Save file
5. Verify agent still has:
   - Frontmatter ✓
   - Title ✓
   - Core content sections ✓
   - No database code ✓

**Example - python-developer.md:**

```markdown
# BEFORE:
---
name: python-developer
description: Expert Python developer...
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Python Developer Agent

You are an expert Python developer...

## Intelligence Database Integration

Before beginning work, source the database helper library:
```bash
source .claude/lib/db-helpers.sh
```

**Use database functions to improve code quality:**
- `db_store_knowledge()` - Store Python best practices...
[... 30-50 lines of database code ...]

## Core Competencies

- **Web Frameworks**: Django, FastAPI, Flask

# AFTER (FIXED):
---
name: python-developer
description: Expert Python developer...
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Python Developer Agent

You are an expert Python developer with deep knowledge of Python ecosystems, best practices, and modern development patterns.

## Core Competencies

- **Web Frameworks**: Django, FastAPI, Flask
[Continue with domain content...]
```

**Repeat for all 48 agents.**

---

### Agents to KEEP Database Integration

**DO NOT remove database integration from these:**

✅ **Orchestrators:**
- `orchestration/project-orchestrator.md`
- `orchestration/feature-orchestrator.md`
- `quality/code-review-orchestrator.md`

✅ **Infrastructure Utilities:**
- `infrastructure/code-intelligence-watcher.md`
- `infrastructure/code-query.md`
- `infrastructure/error-logger.md`

✅ **Meta Agents (Debatable - recommend keeping for now):**
- `meta/agent-architect.md` (after fixing name)
- `meta/plugin-developer.md`
- `meta/skill-architect.md` (after fixing name)
- `meta/workflow-architect.md`

---

## Phase 3: Verbosity Reduction (6-8 hours)

### Agents to Condense (800+ lines → 300-600 lines)

**Target agents:**
1. `compliance/fedramp-specialist.md` (925 lines)
2. `development/languages/csharp-developer.md` (986 lines)
3. `development/languages/kotlin-developer.md` (938 lines)
4. `development/languages/php-developer.md` (901 lines)
5. `development/languages/ruby-developer.md` (877 lines)
6. `development/languages/swift-developer.md` (931 lines)
7. `infrastructure/cloud/gcp-specialist.md` (803 lines)
8. `infrastructure/sre/observability-specialist.md` (829 lines)
9. `meta/skill-architect.md` (804 lines)

### Strategy for Condensing

**For each agent:**

1. **Identify redundant sections**
   - Multiple examples doing the same thing
   - Over-explained basic concepts
   - Repeated patterns

2. **Consolidate code examples**
   - Combine similar examples
   - Remove full-file listings
   - Keep examples 20-100 lines max
   - Target: 5-10 examples total

3. **Focus on essential patterns**
   - Core competencies
   - 3-5 main use cases
   - Testing patterns
   - Best practices

4. **Remove or condense:**
   - Extensive configuration examples
   - Multiple variations of same pattern
   - Over-detailed explanations
   - Historical context (unless critical)

### Example Condensing Process

**csharp-developer.md (986 lines → ~500 lines):**

**Remove:**
- [ ] Redundant ASP.NET Core examples (keep 2-3 best ones)
- [ ] Multiple EF Core patterns (consolidate into 1-2)
- [ ] Excessive middleware examples
- [ ] Verbose dependency injection examples

**Keep:**
- [x] Core C# 8+ features
- [x] ASP.NET Core API example
- [x] Entity Framework pattern
- [x] Testing with xUnit
- [x] Best practices

**Target structure:**
```markdown
# C# Developer Agent

## Core Competencies

## Modern C# Patterns (1 example, 50 lines)

## ASP.NET Core API (1 example, 80 lines)

## Entity Framework Core (1 example, 60 lines)

## Testing (1 example, 50 lines)

## Dependency Injection (1 example, 40 lines)

## Best Practices
```

**Repeat for all 9 verbose agents.**

---

## Validation

After each phase, run validation:

```bash
# Validate all frontmatter
./validate-agents.sh

# Expected output:
# ✓ All agents have valid frontmatter
# ✓ All required fields present
# ✓ No non-standard fields
# ✓ Name matches filename
# ✓ Database integration only in orchestrators
# ✓ All agents < 600 lines
```

### Create Validation Script

```bash
#!/bin/bash

# validate-agents.sh

echo "Validating agents..."
echo ""

total=0
pass=0
fail=0

for file in $(find .claude/agents -name "*.md" -type f | sort); do
  total=$((total + 1))
  agent_name=$(basename "$file" .md)
  issues=""

  # Check frontmatter exists
  if ! grep -q "^---$" "$file"; then
    issues="${issues}Missing frontmatter\n"
  fi

  # Check required fields
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$file" | grep -v '^---$')

  if ! echo "$frontmatter" | grep -q "^name:"; then
    issues="${issues}Missing name field\n"
  fi

  if ! echo "$frontmatter" | grep -q "^description:"; then
    issues="${issues}Missing description field\n"
  fi

  if ! echo "$frontmatter" | grep -q "^model:"; then
    issues="${issues}Missing model field\n"
  fi

  if ! echo "$frontmatter" | grep -q "^tools:"; then
    issues="${issues}Missing tools field\n"
  fi

  # Check for non-standard fields
  if echo "$frontmatter" | grep -q "^categories:"; then
    issues="${issues}Non-standard 'categories' field\n"
  fi

  if echo "$frontmatter" | grep -q "^dependencies:"; then
    issues="${issues}Non-standard 'dependencies' field\n"
  fi

  # Check database integration
  category_path=$(dirname "${file#.claude/agents/}")
  has_db=$(grep -c "db-helpers.sh\|db_store_knowledge\|db_create_workflow" "$file" || echo 0)

  if [[ ! "$category_path" =~ ^(orchestration|meta|infrastructure/(code-intelligence|code-query|error-logger)|quality/code-review-orchestrator) ]] && [ "$has_db" -gt 0 ]; then
    issues="${issues}Database integration in specialist agent\n"
  fi

  # Check file size
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 600 ]; then
    issues="${issues}Agent too verbose ($lines lines)\n"
  fi

  # Report
  if [ -z "$issues" ]; then
    pass=$((pass + 1))
    echo "✓ $agent_name"
  else
    fail=$((fail + 1))
    echo "✗ $agent_name"
    echo -e "$issues" | sed 's/^/  /'
  fi
done

echo ""
echo "Summary:"
echo "  Total: $total"
echo "  Pass:  $pass"
echo "  Fail:  $fail"
echo "  Rate:  $((pass * 100 / total))%"
```

---

## Timeline

### Week 1: Critical Fixes
- **Day 1-2:** Fix 3 frontmatter corruptions (1 hour)
- **Day 2-3:** Fix 10 missing tools + non-standard fields (1-2 hours)
- **Day 3-4:** Test validation script
- **Day 5:** Review and commit

**Goal:** 100% valid frontmatter

### Week 2: Database Cleanup
- **Day 1:** Create and test removal script on 3 agents
- **Day 2-3:** Apply to all 48 specialist agents
- **Day 4:** Manual review of results
- **Day 5:** Validate and commit

**Goal:** Database integration only in orchestrators

### Week 3: Verbosity Reduction
- **Day 1-2:** Condense 5 language specialists
- **Day 3:** Condense 3 infrastructure agents
- **Day 4:** Condense 1 meta agent
- **Day 5:** Validate and commit

**Goal:** All agents < 600 lines

### Week 4: Final Validation
- **Day 1:** Run comprehensive validation
- **Day 2:** Fix any remaining issues
- **Day 3:** Update documentation (CLAUDE.md, README.md)
- **Day 4:** Update plugin.json metadata
- **Day 5:** Final review and release

**Goal:** 95%+ pass rate, ready for release

---

## Tips for Success

1. **Make backups before starting**
   ```bash
   cp -r .claude/agents .claude/agents.backup
   ```

2. **Work in batches**
   - Fix 5-10 agents at a time
   - Validate after each batch
   - Commit working batches

3. **Use version control**
   ```bash
   git checkout -b agent-fixes
   git add .claude/agents/[fixed-files]
   git commit -m "fix: standardize [category] agent frontmatter"
   ```

4. **Test after major changes**
   - Try loading a fixed agent
   - Verify it still works as expected
   - Check no functionality broken

5. **Reference exemplary agents**
   - Copy patterns from `react-specialist.md`
   - Use `project-orchestrator.md` for orchestrators
   - See `EXEMPLARY_AGENTS.md` for more patterns

6. **Ask for help if stuck**
   - Check wshobson/agents repository
   - Review CLAUDE.md for patterns
   - Consult ARCHITECTURE.md for system design

---

## Quick Reference

### Standard Specialist Frontmatter
```yaml
---
name: [agent-name]
description: Expert [role] specializing in [tech]. Use for [cases].
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

### Standard Orchestrator Frontmatter
```yaml
---
name: [name]-orchestrator
description: Orchestrates [process]. Use for [scenarios] requiring coordination.
model: claude-opus-4-1-20250805
tools:
  - Task
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - TodoWrite
---
```

### File Size Targets
- **Specialists:** 200-500 lines (ideal: 300-400)
- **Orchestrators:** 400-600 lines (ideal: 500)
- **Maximum:** 600 lines for any agent

### Database Integration
- **YES:** orchestration/, meta/, infrastructure/(code-*, error-logger)
- **NO:** development/, quality/, devops/, compliance/, infrastructure/(databases, messaging, etc.)

---

## Success Metrics

Track progress with these metrics:

```bash
# Count agents with valid frontmatter
grep -l "^name:" .claude/agents/**/*.md | wc -l

# Count agents with database integration
grep -l "db-helpers.sh" .claude/agents/**/*.md | wc -l

# Count agents over 600 lines
find .claude/agents -name "*.md" -exec wc -l {} \; | awk '$1 > 600 {print}' | wc -l

# Calculate pass rate
./validate-agents.sh | grep "Rate:"
```

**Target metrics:**
- Valid frontmatter: 100%
- Database in specialists: 0%
- Agents > 600 lines: 0%
- Overall pass rate: 95%+

---

## Final Checklist

Before considering Phase complete:

### Phase 1 Complete ✓
- [ ] All 3 name corruptions fixed
- [ ] All 10 missing tools fields added
- [ ] All non-standard fields removed
- [ ] All frontmatter valid YAML
- [ ] Validation script passes frontmatter checks

### Phase 2 Complete ✓
- [ ] Database code removed from 48 specialists
- [ ] Database code retained in 6 orchestrators/utilities
- [ ] All agents still function correctly
- [ ] Validation script passes database checks

### Phase 3 Complete ✓
- [ ] All 9 verbose agents reduced to < 600 lines
- [ ] Quality of content maintained
- [ ] Essential patterns retained
- [ ] Validation script passes size checks

### Final Release ✓
- [ ] 95%+ pass rate achieved
- [ ] All agents tested
- [ ] Documentation updated
- [ ] Plugin metadata updated
- [ ] Release notes created
- [ ] Changes committed and tagged

---

Good luck! 🚀
