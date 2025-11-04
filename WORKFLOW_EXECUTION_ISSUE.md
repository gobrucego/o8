# Workflow Execution Issue - Root Cause Analysis

## The Problem

Workflows (`/add-feature`, `/fix-bug`, etc.) are not automatically delegating to orchestrator agents. Instead, they either:

1. Execute instructions in main Claude context (wrong - wastes tokens, no delegation)
2. Describe what to do but don't actually invoke tools (wrong - Claude just reads, doesn't act)

## Root Cause

**Workflows are DOCUMENTS, not EXECUTABLES.**

Current workflow structure:
```markdown
---
description: Add a feature
executor: "feature-orchestrator"
---

# Workflow

You MUST use the Task tool to delegate...

[Instructions on how to use Task tool]
[Orchestrator instructions with database integration]
```

**What happens:** Claude reads this as a document and either:
- Ignores the "you must use Task tool" part and tries to execute the workflow itself
- Reads the instructions but doesn't know these are IMPERATIVE COMMANDS vs descriptive text

## Why This is Hard to Fix

1. **Workflows are markdown files** - they're not executable code
2. **Claude reads them as context** - not as commands to execute
3. **No execution engine** - there's no interpreter that says "when you see a workflow, immediately delegate"
4. **Ambiguous instructions** - "You MUST use Task tool" is just text, not an actual tool invocation

## What We Need

**Option A: Workflow Execution Engine (Complex)**
- Build a special workflow parser
- Workflows have executable directives
- System recognizes workflow invocation and auto-delegates
- Requires significant infrastructure

**Option B: Stronger Imperative Language (Band-aid)**
- Make the "USE TASK TOOL NOW" instruction SO STRONG that Claude can't ignore it
- Put it at absolute top with visual markers
- Hope Claude's instruction-following is good enough
- Still relies on Claude interpreting text correctly

**Option C: Slash Commands Directly Invoke Task Tool (Proper Fix)**
- When user types `/add-feature [description]`, the system ITSELF invokes Task tool
- Workflow file is passed as the prompt to the delegated agent
- Main Claude never even sees the workflow - it's directly routed to orchestrator
- This requires changes to how slash commands work in Claude Code

## The Intelligence Database Integration

**CRITICAL:** All orchestrator instructions include database integration code like:

```bash
source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh
WORKFLOW_ID="add-feature-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "add-feature" "$*" 4 "normal"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"
db_find_similar_workflows "add-feature" 5
```

This code MUST be preserved in workflows because it:
- Tracks workflow execution
- Learns from past workflows
- Reduces token usage by 80-90%
- Enables multi-hour autonomous operation

**Any "fix" that removes this database code is WRONG.**

## Current State (v2.3.0)

- ✅ All workflows have database integration code intact
- ✅ All workflows have delegation instructions
- ✅ All workflows have `executor` frontmatter field
- ❌ Workflows don't actually invoke Task tool automatically
- ❌ Claude reads workflows as documents, not commands

## Attempted Solutions

### Attempt 1: Add frontmatter fields
- Added `executor` and `delegation_required` fields
- Result: No change in behavior - fields are metadata, not executable

### Attempt 2: Stronger language at top
- Put "IMMEDIATE ACTION REQUIRED" and "USE TASK TOOL NOW"
- Result: Sometimes works, sometimes ignored - depends on Claude's interpretation

### Attempt 3: Remove everything except Task tool call
- Stripped workflows to just Task tool invocation instructions
- Result: BROKE database integration - orchestrators had no instructions

## The Fundamental Tension

**Workflows need TWO audiences:**

1. **Main Claude (workflow invoker):** Needs to immediately use Task tool
2. **Orchestrator Agent (workflow executor):** Needs full instructions with database integration

**Current structure serves ONLY orchestrator, not invoker.**

## Possible Solutions

### Solution 1: Two-Section Workflows

```markdown
<!-- SECTION 1: FOR MAIN CLAUDE - READ THIS FIRST -->
# STOP! DO NOT READ FURTHER!

You are in the main Claude Code context. This workflow MUST be delegated.

IMMEDIATELY invoke Task tool with these EXACT parameters:
- subagent_type: "feature-orchestrator"
- description: "Implement complete feature"
- prompt: [ALL OF SECTION 2 BELOW]

Do NOT execute workflow yourself. Use Task tool NOW.

---

<!-- SECTION 2: FOR ORCHESTRATOR AGENT -->
# Add Feature Workflow

[All orchestrator instructions with database integration]
```

### Solution 2: Workflow Execution Mode

Add to `.claude/CLAUDE.md`:

```markdown
## Workflow Execution Mode

When user invokes a slash command (e.g., `/add-feature [description]`):

1. **Recognize this is a workflow invocation**
2. **Read the workflow file to get executor and instructions**
3. **IMMEDIATELY use Task tool with:**
   - subagent_type: [from executor field]
   - prompt: [entire workflow content + user's description]
4. **Do NOT attempt to execute workflow in main context**
5. **Wait for orchestrator to complete and return results**

**This is a SYSTEM-LEVEL rule. You MUST follow it for ALL slash commands.**
```

### Solution 3: Slash Command Pre-processor (Requires Claude Code changes)

The slash command system itself should:
1. Detect workflow invocation
2. Read workflow file
3. Extract executor from frontmatter
4. Automatically invoke Task tool
5. Pass workflow + user input to orchestrator
6. Main Claude never sees workflow content

## Recommended Path Forward

**Short-term (v2.3.1):**
1. Implement Solution 1 (two-section workflows)
2. Add very strong imperative language at top
3. Add Solution 2 (workflow execution rules) to `.claude/CLAUDE.md`
4. Test with real workflows

**Long-term (v3.0):**
1. Implement Solution 3 (requires Claude Code core changes)
2. Make slash commands automatically delegate
3. Workflows become purely orchestrator instructions
4. No ambiguity - system handles delegation

## Status

**Issue identified:** v2.3.0
**Database integration preserved:** ✅
**Solution designed:** In progress
**Implementation:** Pending

**Next steps:**
1. Implement two-section workflow structure
2. Update CLAUDE.md with workflow execution rules
3. Test with multiple workflows
4. Document results
5. Release v2.3.1 if successful
