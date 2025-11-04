# Agent Review - Detailed Issues Report

**Date:** November 4, 2025
**Total Agents Reviewed:** 72
**Total Issues Found:** 74

## Critical Issues (Must Fix Immediately)

### Issue Category: Frontmatter Non-Standard Fields

**Affected Agents (10):**
- `development/ai-ml/langchain-specialist.md`
- `development/ai-ml/llamaindex-specialist.md`
- `development/blockchain/solidity-specialist.md`
- `development/blockchain/web3-specialist.md`
- `development/game-engines/godot-specialist.md`
- `development/game-engines/unity-specialist.md`
- `development/game-engines/unreal-specialist.md`
- `quality/contract-testing-specialist.md`
- `quality/mutation-testing-specialist.md`

**Issue:**
- Frontmatter contains non-standard fields: `categories` and `dependencies`
- These fields are **not** part of the wshobson/agents pattern
- Missing required `tools` field in frontmatter

**Recommendation:**
Remove `categories` and `dependencies` fields, add `tools` field with appropriate tools.

**Example Fix for langchain-specialist.md:**
```yaml
---
name: langchain-specialist
description: Expert LangChain developer specializing in LLM chains, agents, RAG systems, memory, and production AI application development. Use for building LangChain applications, RAG pipelines, LLM agents, and production AI systems.
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

### Issue Category: Frontmatter Name Corruption

**Affected Agents (3):**
- `infrastructure/code-query.md`
- `meta/agent-architect.md`
- `meta/skill-architect.md`

**Issue:**
The `name` field in frontmatter contains multiple names or corrupted text instead of a single agent name.

**Details:**

#### infrastructure/code-query.md
```yaml
# CURRENT (BROKEN):
name: code-query
example-agent

# SHOULD BE:
name: code-query
```

#### meta/agent-architect.md
```yaml
# CURRENT (BROKEN):
name: agent-architect
technology-specialist
review-specialist
infrastructure-specialist
meta-orchestrator

# SHOULD BE:
name: agent-architect
```

#### meta/skill-architect.md
```yaml
# CURRENT (BROKEN):
name: skill-architect
methodology-name
pattern-library-name
best-practices-name

# SHOULD BE:
name: skill-architect
```

**Recommendation:**
Clean up the `name` field to contain only the agent name.

---

## High Priority Issues (Should Fix Soon)

### Issue Category: Database Integration in Specialist Agents

**Affected Agents (48):**

**ALL of these agents have database integration code (`db-helpers.sh`, `db_store_knowledge`, etc.) but are NOT orchestrators:**

#### Compliance Agents (5):
- `compliance/fedramp-specialist.md`
- `compliance/gdpr-specialist.md`
- `compliance/iso27001-specialist.md`
- `compliance/pci-dss-specialist.md`
- `compliance/soc2-specialist.md`

#### Development Agents (14):
- `development/architect.md`
- `development/fullstack-developer.md`
- `development/languages/cpp-developer.md`
- `development/languages/csharp-developer.md`
- `development/languages/go-developer.md`
- `development/languages/java-developer.md`
- `development/languages/kotlin-developer.md`
- `development/languages/php-developer.md`
- `development/languages/python-developer.md`
- `development/languages/ruby-developer.md`
- `development/languages/rust-developer.md`
- `development/languages/swift-developer.md`
- `development/languages/typescript-developer.md`

#### DevOps Agents (2):
- `devops/cloud/aws-specialist.md`
- `devops/infrastructure/terraform-specialist.md`

#### Infrastructure Agents (15):
- `infrastructure/caching/cdn-specialist.md`
- `infrastructure/caching/redis-cache-specialist.md`
- `infrastructure/cloud/azure-specialist.md`
- `infrastructure/cloud/gcp-specialist.md`
- `infrastructure/databases/mongodb-specialist.md`
- `infrastructure/databases/postgresql-specialist.md`
- `infrastructure/databases/redis-specialist.md`
- `infrastructure/messaging/kafka-specialist.md`
- `infrastructure/messaging/rabbitmq-specialist.md`
- `infrastructure/monitoring/elk-stack-specialist.md`
- `infrastructure/monitoring/prometheus-grafana-specialist.md`
- `infrastructure/search/algolia-specialist.md`
- `infrastructure/search/elasticsearch-specialist.md`
- `infrastructure/sre/observability-specialist.md`
- `infrastructure/sre/sre-specialist.md`

#### Quality Agents (12):
- `quality/code-review-orchestrator.md` *(This one is OK - it's an orchestrator)*
- `quality/code-reviewer.md`
- `quality/contract-testing-specialist.md`
- `quality/debugging/debugger.md`
- `quality/mutation-testing-specialist.md`
- `quality/security-auditor.md`
- `quality/test-engineer.md`
- `quality/testing/load-testing-specialist.md`
- `quality/testing/playwright-specialist.md`

**Issue:**
According to the CLAUDE.md system instructions and wshobson/agents patterns:
- **ONLY orchestrators and meta agents** should have database integration code
- **Specialist agents** should focus on their domain expertise
- Database helpers add significant bloat to agent context (30-50 lines)
- Specialist agents should NOT be tracking workflows, storing knowledge, etc.

**Recommendation:**
Remove database integration sections from all specialist agents. Database integration should ONLY exist in:
- `orchestration/project-orchestrator.md` ✅
- `orchestration/feature-orchestrator.md` ✅
- `infrastructure/code-intelligence-watcher.md` ✅
- `infrastructure/code-query.md` ✅
- `infrastructure/error-logger.md` ✅
- `meta/agent-architect.md` (debatable - could be removed)
- `meta/plugin-developer.md`
- `meta/skill-architect.md`
- `meta/workflow-architect.md`

**Exception:** `quality/code-review-orchestrator.md` is OK because it's an orchestrator.

---

## Medium Priority Issues (Improvements)

### Issue Category: Agent Verbosity

**Agents exceeding 800 lines:**
- `compliance/fedramp-specialist.md` - 925 lines
- `development/languages/csharp-developer.md` - 986 lines
- `development/languages/kotlin-developer.md` - 938 lines
- `development/languages/php-developer.md` - 901 lines
- `development/languages/ruby-developer.md` - 877 lines
- `development/languages/swift-developer.md` - 931 lines
- `infrastructure/cloud/gcp-specialist.md` - 803 lines
- `infrastructure/sre/observability-specialist.md` - 829 lines
- `meta/skill-architect.md` - 804 lines

**Issue:**
According to wshobson/agents patterns, most specialist agents should be 200-500 lines. These agents are 800-980 lines, which:
- Increases token usage significantly
- Makes agents harder to maintain
- Bloats context unnecessarily
- Violates the "minimal token usage" principle from wshobson/agents

**Recommendation:**
Condense these agents by:
1. Removing redundant examples
2. Removing database integration sections (see above)
3. Focusing on essential patterns only
4. Moving extensive examples to separate skill files
5. Target: 300-600 lines max per specialist agent

---

## Pattern Comparison: wshobson/agents vs orchestr8

### ✅ What We're Doing Right

1. **Frontmatter Structure**: Core fields (name, description, model, tools) match
2. **Model Selection**: Opus for orchestrators, Sonnet for specialists ✅
3. **Tool Selection**: Appropriate tools for agent roles ✅
4. **Description Format**: Clear, actionable descriptions with "Use when" context ✅
5. **Agent Categories**: Well-organized directory structure ✅
6. **Documentation Quality**: Rich examples and patterns ✅

### ❌ What Needs Fixing

1. **Database Integration Overuse**: 48 agents have database code when only 5-10 should
2. **Non-Standard Frontmatter Fields**: 10 agents use `categories` and `dependencies` fields
3. **Frontmatter Corruption**: 3 agents have malformed `name` fields
4. **Agent Verbosity**: 9 agents are 2-3x the recommended length
5. **Missing Tools Field**: 10 agents missing required `tools` field

### Key Insights from wshobson/agents Pattern

**From the repository documentation:**
> "63 focused plugins optimized for minimal token usage"
> "Progressive disclosure pattern: Metadata → Instructions → Resources"
> "Agents distributed across two model tiers: 47 Haiku agents for deterministic tasks, 97 Sonnet agents for complex reasoning"

**Our system should:**
- Keep specialist agents lean (200-500 lines)
- Remove database code from specialists
- Use progressive disclosure (move extensive examples to skills)
- Maintain strict frontmatter standards

---

## Detailed Agent-by-Agent Issues

### Development Category

#### ✅ Excellent Agents (No Issues)
- `development/api/graphql-specialist.md`
- `development/api/grpc-specialist.md`
- `development/api/openapi-specialist.md`
- `development/data/data-engineer.md`
- `development/data/ml-engineer.md`
- `development/data/mlops-specialist.md`
- `development/frontend/angular-specialist.md`
- `development/frontend/nextjs-specialist.md`
- `development/frontend/react-specialist.md`
- `development/frontend/vue-specialist.md`
- `development/mobile/compose-specialist.md`
- `development/mobile/swiftui-specialist.md`

#### ⚠️ Agents Needing Fixes

**langchain-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**llamaindex-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**solidity-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**web3-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**godot-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**unity-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**unreal-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**architect.md**
- [ ] Remove database integration section (lines 17-48)

**fullstack-developer.md**
- [ ] Remove database integration section

**All language specialists (11 agents):**
- [ ] Remove "Intelligence Database Integration" section
- [ ] Focus on language-specific expertise only
- [ ] Reduce file size to 300-600 lines where applicable

### Quality Category

**contract-testing-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Remove database integration section
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**mutation-testing-specialist.md**
- [ ] Missing `tools` field
- [ ] Remove `categories` field
- [ ] Remove `dependencies` field
- [ ] Remove database integration section
- [ ] Add tools: Read, Write, Edit, Bash, Glob, Grep

**code-reviewer.md, debugger.md, security-auditor.md, test-engineer.md, load-testing-specialist.md, playwright-specialist.md:**
- [ ] Remove database integration sections

### Infrastructure Category

**code-query.md**
- [ ] Fix corrupted `name` field (should be just "code-query")

**All database/messaging/monitoring/search/caching/cloud specialists (15 agents):**
- [ ] Remove database integration sections
- [ ] These are specialists, not orchestrators

### Compliance Category

**All 5 compliance agents:**
- [ ] Remove database integration sections
- [ ] Compliance agents can log findings without database helpers
- [ ] Reduce verbosity (fedramp-specialist is 925 lines)

### Meta Category

**agent-architect.md**
- [ ] Fix corrupted `name` field
- [ ] Debatable whether to keep database integration (meta agent, could be OK)

**skill-architect.md**
- [ ] Fix corrupted `name` field
- [ ] Reduce from 804 lines to 400-500 lines

### Orchestration Category

**✅ Both orchestrators are perfect:**
- `feature-orchestrator.md` - No issues
- `project-orchestrator.md` - No issues

---

## Fix Priority Order

### Immediate (Critical Bugs)

1. **Fix frontmatter name corruption (3 agents):**
   - `infrastructure/code-query.md`
   - `meta/agent-architect.md`
   - `meta/skill-architect.md`

2. **Fix missing tools + remove non-standard fields (10 agents):**
   - All AI/ML, blockchain, game engine agents
   - contract-testing-specialist, mutation-testing-specialist

### High Priority (Architectural Issues)

3. **Remove database integration from specialist agents (48 agents):**
   - This is the biggest issue affecting nearly 67% of agents
   - Violates wshobson/agents "minimal token usage" principle
   - Creates confusion about agent responsibilities
   - Recommended approach:
     - Remove entire "Intelligence Database Integration" sections
     - Keep database code ONLY in orchestrators and infrastructure agents
     - Update CLAUDE.md to clarify this pattern

### Medium Priority (Optimization)

4. **Reduce agent verbosity (9 agents):**
   - Target: Reduce from 800-986 lines to 300-600 lines
   - Remove redundant examples
   - Focus on essential patterns

---

## Recommended Action Plan

### Phase 1: Frontmatter Fixes (30 minutes)
1. Fix 3 name corruptions
2. Fix 10 agents with non-standard fields
3. Verify all frontmatter is valid YAML

### Phase 2: Database Integration Cleanup (2 hours)
1. Create script to remove database sections
2. Test 2-3 agents manually
3. Batch remove from all 48 specialist agents
4. Verify orchestrators still have integration

### Phase 3: Verbosity Reduction (3 hours)
1. Condense 9 verbose agents
2. Move extensive examples to separate skill files
3. Focus on core competencies

### Phase 4: Validation (1 hour)
1. Run validation script on all agents
2. Verify all frontmatter fields present
3. Verify no database code in specialists
4. Check agent sizes reasonable

**Total Estimated Time:** 6-7 hours

---

## Exemplary Agents (Use as Patterns)

### Perfect Specialist Agents
These agents follow wshobson/agents patterns perfectly:

1. **react-specialist.md** ✅
   - Clean frontmatter
   - Appropriate tools
   - No database integration
   - Focused on React expertise
   - Good length (460 lines)
   - Excellent code examples

2. **nextjs-specialist.md** ✅
   - All frontmatter fields correct
   - Domain-focused content
   - No database bloat

3. **typescript-developer.md** ✅
   - Proper tool selection
   - Clean structure
   - Language-specific focus

4. **graphql-specialist.md** ✅
5. **grpc-specialist.md** ✅
6. **openapi-specialist.md** ✅

### Perfect Orchestrators
1. **project-orchestrator.md** ✅
   - Opus 4 model ✅
   - Database integration appropriate ✅
   - TodoWrite tool included ✅
   - Task tool for coordination ✅

2. **feature-orchestrator.md** ✅

**Use these 8 agents as reference patterns when fixing others.**

---

## Questions for Review

1. **Database Integration Philosophy:**
   - Should meta agents (agent-architect, skill-architect, workflow-architect) have database integration?
   - Current stance: Only orchestrators + infrastructure utility agents
   - Recommendation: Remove from meta agents too for consistency

2. **Compliance Agents:**
   - Should compliance agents be able to track audit trails in database?
   - Current: They have database code
   - Recommendation: Remove - they can write audit files instead

3. **Architect Agent:**
   - Is `development/architect.md` an orchestrator or specialist?
   - Current: It has database code
   - It uses Opus 4 model ✅
   - Recommendation: Could keep database integration if treating it as mini-orchestrator

4. **Model Selection Validation:**
   - Should ALL orchestrators use Opus 4?
   - Current: `code-review-orchestrator` uses Opus 4 ✅
   - But `security-auditor` uses Opus 4 (is it an orchestrator? No, it's quality agent)
   - Recommendation: Verify security-auditor should be Opus or Sonnet

---

## Summary Statistics

| Category | Total | Issues | Pass Rate |
|----------|-------|--------|-----------|
| Development | 27 | 24 | 11% |
| Quality | 9 | 9 | 0% |
| Infrastructure | 18 | 16 | 11% |
| DevOps | 2 | 2 | 0% |
| Compliance | 5 | 5 | 0% |
| Orchestration | 2 | 0 | 100% ✅ |
| Meta | 4 | 2 | 50% |
| **TOTAL** | **72** | **58** | **19%** |

**19% of agents are perfect** - We have good examples to follow!

**81% of agents need fixes** - But most are simple, systematic fixes.
