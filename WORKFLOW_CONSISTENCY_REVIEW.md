# Workflow Consistency Review

**Date**: 2025-01-04
**Reviewer**: Claude (Autonomous System Review)
**Scope**: All 19 workflows in `.claude/commands/`

---

## Executive Summary

### Overall Status: ⚠️ MAJOR INCONSISTENCIES FOUND

- **Total Workflows**: 19
- **Fully Consistent**: 5 (26%)
- **Minor Issues**: 4 (21%)
- **Major Issues**: 10 (53%)

### Key Findings

1. **Critical Issue**: Only **workflows 14-15** (create-workflow, create-skill) follow the NEW explicit Task tool pattern with `⚡ EXECUTE TASK TOOL` markers
2. **Workflows 1-13**: Follow an OLDER pattern with database integration and quality gates, but **NO explicit Task tool invocation markers**
3. **Workflows 16-19**: Have **NO database integration, NO Task patterns, NO quality gates** - completely inconsistent structure
4. **Security-audit (3)**: Lacks **ALL** required pattern elements entirely

### Required Pattern Compliance

| Pattern Element | Workflows with Element | Compliance |
|----------------|------------------------|------------|
| Database Integration | 2/19 (11%) | ❌ CRITICAL |
| ⚡ EXECUTE TASK TOOL markers | 2/19 (11%) | ❌ CRITICAL |
| Multi-phase structure | 15/19 (79%) | ⚠️ PARTIAL |
| Quality gates | 13/19 (68%) | ⚠️ PARTIAL |
| Success criteria | 16/19 (84%) | ✅ GOOD |
| Token tracking | 2/19 (11%) | ❌ CRITICAL |
| Expected outputs per phase | 5/19 (26%) | ❌ CRITICAL |

---

## Detailed Findings

### ✅ Fully Consistent Workflows (Follow NEW Pattern)

**Only 2 workflows follow the complete new pattern:**

#### 14. create-workflow.md ✅
- ✅ Database integration at top (`db_start_workflow`, `db_query_similar_workflows`)
- ✅ Explicit `⚡ EXECUTE TASK TOOL` markers in ALL phases
- ✅ Multi-phase structure (5 phases totaling 100%)
- ✅ Expected outputs listed per phase
- ✅ Quality gates with bash validation in each phase
- ✅ Token tracking per phase (`db_track_tokens`)
- ✅ Success criteria checklist (17 items)
- ✅ Workflow completion section with `db_complete_workflow`

#### 15. create-skill.md ✅
- ✅ Database integration at top
- ✅ Explicit `⚡ EXECUTE TASK TOOL` markers in ALL phases
- ✅ Multi-phase structure (5 phases totaling 100%)
- ✅ Expected outputs listed per phase
- ✅ Quality gates with bash validation
- ✅ Token tracking per phase
- ✅ Success criteria checklist (17 items)
- ✅ Workflow completion section

---

### ⚠️ Workflows with PARTIAL Pattern (OLD Pattern - Workflows 1-13)

**These follow an older pattern with database integration and quality gates, but LACK explicit Task tool markers:**

#### 1. add-feature.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ Uses implicit delegation pattern: "Use Task tool with: subagent_type: feature-orchestrator"
- ✅ Has database integration (db_create_workflow, db_track_tokens)
- ✅ Has quality gates with db_log_quality_gate
- ✅ Has success criteria (8 items)
- ⚠️ Phase percentages not explicit in sections (only in intro)

**Fix Required:**
- Add `⚡ EXECUTE TASK TOOL:` markers with explicit `subagent_type`, `description`, `prompt` blocks
- Add "Expected Outputs:" sections after each Task invocation
- Make phase percentages visible in section headers

#### 2. fix-bug.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ Uses implicit "Use `debugger` agent to:" pattern
- ✅ Has database integration (db_create_workflow, db_log_error, db_resolve_error)
- ✅ Has quality gates
- ✅ Has success criteria (12 items)
- ⚠️ Phase percentages only mentioned in intro

**Fix Required:**
- Add explicit Task tool markers
- Add "Expected Outputs:" sections
- Make phase percentages explicit

#### 4. optimize-performance.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration at all
- ❌ Uses implicit "Use `fullstack-developer` or framework specialist:" pattern
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (10 items)
- ✅ Has multi-phase structure (7 phases with percentages)

**Fix Required:**
- Add database integration section at top
- Add `⚡ EXECUTE TASK TOOL` markers for all phases
- Add token tracking
- Add "Expected Outputs:" sections

#### 5. deploy.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses implicit "Use all quality agents in parallel:" pattern
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (13 items)
- ✅ Has multi-phase structure (6 phases with percentages)

**Fix Required:**
- Add database integration
- Add explicit Task tool markers
- Add token tracking

#### 6. review-code.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses implicit "Use Task tool to invoke code-review-orchestrator with:" pattern
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (5 items)
- ⚠️ Phase percentages exist but not explicit

**Fix Required:**
- Add database integration
- Add explicit `⚡ EXECUTE TASK TOOL` markers
- Make phase percentages explicit

#### 7. review-pr.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses implicit "Use Task tool to invoke code-review-orchestrator with:" pattern
- ✅ Has quality gates
- ✅ Has success criteria (7 items)
- ⚠️ Phase percentages exist but not explicit

**Fix Required:**
- Add database integration
- Add explicit Task tool markers
- Make phase percentages explicit

#### 8. review-architecture.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses implicit pattern: "Use `architect` to design optimization strategy:"
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (8 items)
- ⚠️ Has phases but percentages not always explicit

**Fix Required:**
- Add database integration
- Add explicit Task tool markers
- Make all phase percentages explicit

#### 9. optimize-costs.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses narrative "frontmatter only" format (name/description, no real workflow structure)
- ❌ NO explicit phases with percentages
- ⚠️ Has quality gates (checklist at end)
- ⚠️ Has success metrics but not formal success criteria

**Fix Required:**
- Complete restructure needed
- Add database integration
- Add explicit phases with percentages
- Add Task tool markers
- Add "Expected Outputs:" sections

#### 10. setup-cicd.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ EXTREMELY short format (only 66 lines - appears to be a stub)
- ❌ Phases exist but NO detailed instructions
- ❌ NO quality gates
- ❌ NO success criteria

**Fix Required:**
- Complete rewrite needed
- Add database integration
- Add detailed phases with Task tool markers
- Add quality gates and success criteria

#### 11. build-ml-pipeline.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses narrative "frontmatter only" format
- ✅ Has phases (6 phases mentioned)
- ✅ Has quality gates (checkboxes)
- ✅ Has success criteria (8 items)
- ⚠️ Phases have percentage ranges but not exact

**Fix Required:**
- Add database integration
- Add explicit Task tool markers with full invocation blocks
- Add "Expected Outputs:" sections

#### 12. modernize-legacy.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses narrative "frontmatter only" format
- ✅ Has phases (7 phases mentioned)
- ✅ Has quality gates (checkboxes)
- ✅ Has success criteria (9 items)
- ⚠️ Phases exist but percentages not always explicit

**Fix Required:**
- Add database integration
- Add explicit Task tool markers
- Make all phase percentages explicit

#### 13. create-agent.md ⚠️
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ Uses implicit pattern: "Use `agent-architect` to analyze requirements:"
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (18 items)
- ✅ Has phases (6 phases with percentages)

**Fix Required:**
- Add database integration
- Add explicit `⚡ EXECUTE TASK TOOL` markers
- Add "Expected Outputs:" sections

---

### ❌ Workflows with MAJOR Issues (NO Pattern Compliance)

**These workflows lack nearly ALL required pattern elements:**

#### 3. security-audit.md ❌
**Issues:**
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ NO database integration
- ❌ NO explicit multi-phase structure with percentages
- ❌ Uses implicit pattern: "Use `security-auditor` agent to:"
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (10 items)

**Fix Required:**
- Add database integration section
- Add explicit phases with percentages (e.g., Phase 1: 0-15%, Phase 2: 15-45%, etc.)
- Add `⚡ EXECUTE TASK TOOL` markers for each phase
- Add "Expected Outputs:" sections
- Add token tracking

#### 16. test-web-ui.md ❌
**Issues:**
- ❌ NO database integration
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ Uses implicit pattern: "Use `fullstack-developer` or `frontend-developer` to prepare:"
- ✅ Has phases (7 phases with percentages)
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (9 items)

**Fix Required:**
- Add database integration section at top
- Add explicit `⚡ EXECUTE TASK TOOL` markers
- Add "Expected Outputs:" sections
- Add token tracking per phase

#### 17. refactor.md ❌
**Issues:**
- ❌ NO database integration
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ Uses implicit pattern: "Use `code-archaeologist` and `code-reviewer` to:"
- ✅ Has phases (5 phases with percentages)
- ✅ Has quality gates ("CHECKPOINT" markers)
- ✅ Has success criteria (10 items)

**Fix Required:**
- Add database integration
- Add explicit Task tool markers with full invocation blocks
- Add "Expected Outputs:" sections
- Add token tracking

#### 18. setup-monitoring.md ❌
**Issues:**
- ❌ NO database integration
- ❌ NO `⚡ EXECUTE TASK TOOL` markers
- ❌ Uses narrative "frontmatter only" format (name/description only)
- ✅ Has phases (8 phases mentioned)
- ✅ Has quality gates (checkboxes)
- ✅ Has success criteria (8 items)
- ⚠️ Phases exist but percentages are time estimates, not percentages

**Fix Required:**
- Add database integration
- Convert time estimates to percentage allocations
- Add explicit Task tool markers
- Add "Expected Outputs:" sections
- Add token tracking

#### 19. new-project.md ❌
**Issues:**
- ❌ NO database integration
- ❌ NO explicit `⚡ EXECUTE TASK TOOL` markers
- ❌ NO explicit phases with percentages
- ❌ Uses narrative "step" format instead of phases
- ❌ Has success criteria (9 items) but no quality gates with bash validation
- ⚠️ Uses "⚠️ CRITICAL: Autonomous Orchestration Required" delegation pattern (good) but then doesn't follow through with explicit Task tool patterns in orchestrator instructions

**Fix Required:**
- Add database integration
- Convert "Steps" to "Phases" with percentages
- Add explicit `⚡ EXECUTE TASK TOOL` markers for each phase
- Add quality gates with bash validation
- Add "Expected Outputs:" sections
- Add token tracking

---

## Pattern Comparison Matrix

| Workflow | DB Integration | Task Markers | Phases % | Expected Outputs | Quality Gates | Token Tracking | Success Criteria | Consistency Score |
|----------|---------------|--------------|----------|------------------|---------------|----------------|------------------|-------------------|
| 1. add-feature | ✅ | ❌ | ⚠️ | ❌ | ✅ | ✅ | ✅ | 57% |
| 2. fix-bug | ✅ | ❌ | ⚠️ | ❌ | ✅ | ✅ | ✅ | 57% |
| 3. security-audit | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | 29% |
| 4. optimize-performance | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | 43% |
| 5. deploy | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | 43% |
| 6. review-code | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ | 29% |
| 7. review-pr | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ | 29% |
| 8. review-architecture | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ | 29% |
| 9. optimize-costs | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | 14% |
| 10. setup-cicd | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ | 14% |
| 11. build-ml-pipeline | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | 43% |
| 12. modernize-legacy | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ | 29% |
| 13. create-agent | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | 43% |
| 14. create-workflow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** |
| 15. create-skill | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **100%** |
| 16. test-web-ui | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | 43% |
| 17. refactor | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | 43% |
| 18. setup-monitoring | ❌ | ❌ | ⚠️ | ❌ | ✅ | ❌ | ✅ | 29% |
| 19. new-project | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ✅ | 14% |

**Average Consistency Score: 39%**

---

## Required Pattern Elements - Detailed Checklist

Based on workflows 14-15, the REQUIRED pattern is:

### 1. Database Integration Section (TOP of file)
```bash
source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh

workflow_id=$(db_start_workflow "workflow-name" "$(date +%s)" "{\"param\":\"$1\"}")
echo "🚀 Starting [Workflow Name]"
echo "Requirements: $1"
echo "Workflow ID: $workflow_id"

db_query_similar_workflows "workflow-name" 5
```

### 2. Multi-Phase Structure with Percentages
```markdown
## Phase 1: Phase Name (0-20%)
## Phase 2: Phase Name (20-45%)
## Phase 3: Phase Name (45-75%)
...
```
Percentages MUST total 100%

### 3. Explicit Task Tool Invocation PER PHASE
```markdown
**⚡ EXECUTE TASK TOOL:**
```
Use the [agent-name] agent to:
1. Specific task
2. Specific task

subagent_type: "agent-name"
description: "5-10 word description"
prompt: "Detailed prompt with:

Instructions:
1. Task
2. Task

Expected outputs:
- Output 1
- Output 2
"
```
```

### 4. Expected Outputs After Each Task
```markdown
**Expected Outputs:**
- `file1.md` - Description
- `file2.json` - Description
```

### 5. Quality Gate with Bash Validation
```bash
**Quality Gate: Gate Name**
```bash
if [ ! -f "required-file" ]; then
  echo "❌ Validation failed"
  db_log_error "$workflow_id" "ErrorType" "Message" "workflow" "phase" "0"
  exit 1
fi
echo "✅ Validation passed"
```
```

### 6. Token Tracking Per Phase
```bash
**Track Progress:**
```bash
TOKENS_USED=4000
db_track_tokens "$workflow_id" "phase-name" $TOKENS_USED "20%"

db_store_knowledge "category" "subcategory" "key" \
  "Summary text" \
  "Code or content snippet"
```
```

### 7. Workflow Complete Section (BOTTOM of file)
```bash
db_complete_workflow "$workflow_id" "success" "Summary message"
db_workflow_metrics "$workflow_id"
db_token_savings_report "$workflow_id"

echo "✅ WORKFLOW COMPLETE"
echo "Key metrics..."
```

### 8. Success Criteria Checklist
```markdown
## Success Criteria Checklist

- ✅ Criterion 1
- ✅ Criterion 2
...
(8-12 items minimum)
```

---

## Recommendations

### Priority 1: CRITICAL (Must Fix Immediately)

1. **Add Database Integration to ALL workflows** (17 workflows missing this)
   - Add `source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh`
   - Add `db_start_workflow` initialization
   - Add `db_complete_workflow` at end
   - Estimated effort: 15-20 min per workflow = **5 hours total**

2. **Add Explicit Task Tool Markers to ALL workflows** (17 workflows missing this)
   - Add `⚡ EXECUTE TASK TOOL:` markers before each agent invocation
   - Convert implicit patterns to explicit `subagent_type`, `description`, `prompt` blocks
   - Add "Expected Outputs:" after each invocation
   - Estimated effort: 20-30 min per workflow = **8 hours total**

### Priority 2: HIGH (Fix Soon)

3. **Add Token Tracking to ALL workflows** (17 workflows missing this)
   - Add `db_track_tokens` after each phase
   - Add `db_store_knowledge` to capture learnings
   - Estimated effort: 10 min per workflow = **3 hours total**

4. **Make Phase Percentages Explicit** (10 workflows need this)
   - Ensure all phases show percentage ranges in headers
   - Ensure phases total 100%
   - Estimated effort: 5 min per workflow = **1 hour total**

5. **Add Quality Gates with Bash Validation** (6 workflows missing proper validation)
   - Convert CHECKPOINT markers to bash validation blocks
   - Add `db_log_error` on failures
   - Estimated effort: 15 min per workflow = **1.5 hours total**

### Priority 3: MEDIUM (Nice to Have)

6. **Standardize Success Criteria Format** (all workflows)
   - Ensure 8-12 items minimum
   - Use consistent checkbox format
   - Estimated effort: 5 min per workflow = **1.5 hours total**

7. **Add "Expected Outputs" sections everywhere** (14 workflows missing this)
   - List specific files/artifacts produced by each phase
   - Estimated effort: 10 min per workflow = **2.5 hours total**

### Total Effort to Achieve 95%+ Consistency: **~22 hours**

---

## Specific Fix Examples

### Example 1: fix-bug.md (Currently 57% consistent)

**Current Pattern (WRONG):**
```markdown
### Phase 1: Bug Triage & Reproduction (15%)

**Use `debugger` agent to:**

1. **Analyze Bug Report**
   - Parse error messages
   ...
```

**Should Be:**
```markdown
## Phase 1: Bug Triage & Reproduction (0-15%)

**⚡ EXECUTE TASK TOOL:**
```
Use the debugger agent to:
1. Analyze bug report and parse error messages
2. Reproduce bug locally with failing test

subagent_type: "debugger"
description: "Triage and reproduce reported bug"
prompt: "Analyze and reproduce the bug:

Bug Description: $1

Tasks:
1. **Analyze Bug Report**
   - Parse error messages and stack traces
   - Identify affected components
   - Check if known issue

2. **Reproduce Locally**
   - Set up exact environment
   - Follow reproduction steps
   - Verify bug manifests

3. **Create Failing Test**
   - Write test that demonstrates bug
   - Ensure test fails consistently

Expected outputs:
- Reproduction steps documented
- Failing test created
- Error logs captured
"
```

**Expected Outputs:**
- `bug-reproduction.md` - Documented reproduction steps
- `tests/test_bug_fix.py` - Failing test case
- `error-logs.txt` - Captured error logs

**Quality Gate: Bug Reproduction**
```bash
if [ ! -f "bug-reproduction.md" ]; then
  echo "❌ Bug reproduction not documented"
  db_log_error "$workflow_id" "ValidationError" "Reproduction steps missing" "fix-bug" "phase-1" "0"
  exit 1
fi
echo "✅ Bug reproduced and documented"
```

**Track Progress:**
```bash
TOKENS_USED=3000
db_track_tokens "$workflow_id" "bug-triage" $TOKENS_USED "15%"

db_store_knowledge "bug-fixing" "triage" "$(echo $1 | tr -dc '[:alnum:]' | head -c 20)" \
  "Bug triaged and reproduced" \
  "$(cat bug-reproduction.md | head -50)"
```
```

### Example 2: security-audit.md (Currently 29% consistent)

**Needs:**
1. Database integration section at top
2. Explicit phases with percentages (currently just numbered sections)
3. `⚡ EXECUTE TASK TOOL` markers throughout
4. Token tracking per phase
5. "Expected Outputs" sections

**Should restructure from:**
```markdown
### Phase 1: Security Reconnaissance (15%)

**Use `security-auditor` agent to:**

1. **Define Audit Scope**
```

**To:**
```markdown
## Phase 1: Security Reconnaissance (0-15%)

**⚡ EXECUTE TASK TOOL:**
```
Use the security-auditor agent to:
1. Define complete audit scope
2. Inventory all system assets
3. Perform threat modeling

subagent_type: "security-auditor"
description: "Define audit scope and perform reconnaissance"
prompt: "Conduct security reconnaissance:

System Details: [from requirements]

Tasks:
1. **Define Audit Scope**
   ...

Expected outputs:
- Audit scope document
- Asset inventory
- Threat model
"
```

**Expected Outputs:**
- `security-audit-scope.md` - Complete scope definition
- `asset-inventory.json` - All assets catalogued
- `threat-model.md` - Threat analysis

**Quality Gate: Scope Validation**
```bash
if [ ! -f "security-audit-scope.md" ]; then
  echo "❌ Audit scope not defined"
  db_log_error "$workflow_id" "ValidationError" "Scope definition missing" "security-audit" "phase-1" "0"
  exit 1
fi
echo "✅ Audit scope validated"
```

**Track Progress:**
```bash
TOKENS_USED=5000
db_track_tokens "$workflow_id" "reconnaissance" $TOKENS_USED "15%"

db_store_knowledge "security" "audit" "reconnaissance" \
  "Security audit scope defined" \
  "$(cat security-audit-scope.md | head -100)"
```
```

---

## Conclusion

### Current State: ❌ HIGHLY INCONSISTENT

Only **2 out of 19 workflows (11%)** follow the complete new pattern established in workflows 14-15.

### Target State: ✅ 95%+ CONSISTENCY

All 19 workflows should follow the identical pattern with:
- Database integration
- Explicit Task tool invocation markers
- Multi-phase structure with percentages totaling 100%
- Expected outputs per phase
- Quality gates with bash validation
- Token tracking per phase
- Success criteria checklist
- Workflow completion section

### Recommended Action Plan

1. **Week 1**: Fix workflows 1-2 (add-feature, fix-bug) - these are closest to target (57% consistent)
2. **Week 2**: Fix workflows 4-8 (optimize-performance through review-architecture)
3. **Week 3**: Fix workflows 11-13, 16-17 (ml-pipeline, modernize-legacy, create-agent, test-web-ui, refactor)
4. **Week 4**: Fix workflows 3, 9-10, 18-19 (security-audit, optimize-costs, setup-cicd, setup-monitoring, new-project) - these need most work

**Total Estimated Effort: 22 hours over 4 weeks**

### Success Metrics

- **Target**: 95%+ consistency score across all workflows
- **Current**: 39% average consistency
- **Improvement Needed**: +56 percentage points

---

## Appendix: Quick Reference Pattern Template

```markdown
---
description: [Action verb] [scope] with [capabilities] - [benefits]
argumentHint: "[argument-description]"
---

# Workflow Name

## Intelligence Database Integration

```bash
source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh
workflow_id=$(db_start_workflow "workflow-name" "$(date +%s)" "{\"param\":\"$1\"}")
echo "🚀 Starting Workflow"
db_query_similar_workflows "workflow-name" 5
```

---

## Phase 1: Phase Name (0-20%)

**⚡ EXECUTE TASK TOOL:**
```
Use the [agent] agent to:
1. Task
2. Task

subagent_type: "agent"
description: "5-10 words"
prompt: "Full prompt...

Expected outputs:
- Output 1
"
```

**Expected Outputs:**
- `file.md` - Description

**Quality Gate: Gate Name**
```bash
if [ ! -f "file" ]; then
  echo "❌ Failed"
  db_log_error "$workflow_id" "Type" "Message" "workflow" "phase" "0"
  exit 1
fi
echo "✅ Passed"
```

**Track Progress:**
```bash
TOKENS_USED=4000
db_track_tokens "$workflow_id" "phase" $TOKENS_USED "20%"
db_store_knowledge "cat" "subcat" "key" "summary" "code"
```

---

[Repeat for all phases]

---

## Workflow Complete

```bash
db_complete_workflow "$workflow_id" "success" "Summary"
db_workflow_metrics "$workflow_id"
db_token_savings_report "$workflow_id"
echo "✅ COMPLETE"
```

## Success Criteria Checklist

- ✅ Criterion 1
- ✅ Criterion 2
...
```

---

**END OF REPORT**
