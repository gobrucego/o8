# Skill Fix Guide - Quick Reference

This guide provides the exact changes needed to fix all skill issues.

---

## Priority 1: Fix Frontmatter (4 skills - 5 minutes)

### Skills needing frontmatter fixes:

1. `/Users/seth/Projects/orchestr8/.claude/skills/patterns/database-error-learning/SKILL.md`
2. `/Users/seth/Projects/orchestr8/.claude/skills/patterns/database-knowledge-storage/SKILL.md`
3. `/Users/seth/Projects/orchestr8/.claude/skills/patterns/database-optimization/SKILL.md`
4. `/Users/seth/Projects/orchestr8/.claude/skills/patterns/database-tracking-patterns/SKILL.md`

### What to change:

**Remove these lines from frontmatter:**
```yaml
autoActivationContext:
  - context 1
  - context 2
  - context 3
```

**Before:**
```yaml
---
name: database-error-learning
description: Expertise in logging errors and learning from failures...
autoActivationContext:
  - error handling
  - debugging
  - failure analysis
  - error logging
  - troubleshooting
---
```

**After:**
```yaml
---
name: database-error-learning
description: Expertise in logging errors and learning from failures...
---
```

**Action:** Delete lines 4-9 in each file (the autoActivationContext section).

---

## Priority 2: Refine Descriptions (8 skills - 30 minutes)

### Description Pattern

**Target pattern:**
```
"Expertise in [what]. Activate when [when]. [Single directive sentence with outcome]."
```

**Rules:**
- Remove "Auto-activates" (use "Activate when" instead)
- Remove "Enables" (be more directive)
- Be specific about what the skill does
- Keep under 300 characters if possible

---

### Skill 1: meta/agent-design-patterns

**Current:**
```
Expertise in Claude Code agent design patterns, frontmatter structure, tool selection, and documentation standards. Activate when designing or creating new agents for the orchestr8 plugin system.
```

**Better:**
```
Expertise in agent design patterns and architecture. Activate when designing agents, selecting tools, or structuring documentation. Provides frontmatter templates, model selection strategy, and comprehensive agent patterns.
```

---

### Skill 2: meta/plugin-architecture

**Current:**
```
Expertise in Claude Code plugin structure, semantic versioning, metadata management, and component synchronization. Activate when creating plugins, updating versions, or managing plugin metadata.
```

**Better:**
```
Expertise in plugin architecture and versioning. Activate when managing plugin metadata, updating versions, or synchronizing components. Ensures consistency across version files, manifests, and changelogs.
```

---

### Skill 3: meta/workflow-orchestration-patterns

**Current:**
```
Expertise in autonomous workflow design patterns including multi-phase execution, quality gates, agent coordination, and success criteria definition. Activate when designing or creating workflow slash commands.
```

**Better:**
```
Expertise in workflow orchestration patterns. Activate when designing autonomous workflows, implementing quality gates, or coordinating multi-agent executions. Provides phase-based execution, checkpoint patterns, and success criteria templates.
```

---

### Skill 4: patterns/database-error-learning

**Current:**
```
Expertise in logging errors and learning from failures using the orchestr8 intelligence database. Auto-activates when handling errors, debugging issues, or analyzing failure patterns. Enables continuous improvement through error analysis and resolution tracking.
```

**Better:**
```
Expertise in error learning and resolution tracking. Activate when handling errors, debugging issues, or analyzing failure patterns. Logs errors with categorization, queries similar past errors, and stores resolutions for continuous improvement.
```

**Changes:**
- "Auto-activates" → "Activate"
- Remove "Enables continuous improvement"
- Be more specific about what it does

---

### Skill 5: patterns/database-knowledge-storage

**Current:**
```
Expertise in storing and retrieving agent knowledge using the orchestr8 intelligence database. Auto-activates when agents need to learn from experience, store best practices, or query historical knowledge. Enables continuous learning and knowledge accumulation.
```

**Better:**
```
Expertise in knowledge management and storage. Activate when storing patterns, querying agent knowledge, or tracking confidence scores. Manages reusable patterns, best practices, and anti-patterns with confidence tracking.
```

**Changes:**
- "Auto-activates when agents need to" → "Activate when"
- Remove "Enables continuous learning"
- More specific about confidence tracking

---

### Skill 6: patterns/database-optimization

**Current:**
```
Expertise in tracking and optimizing token usage and database operations. Auto-activates when analyzing performance, optimizing token consumption, or making database vs file-loading decisions. Enables data-driven optimization and cost reduction.
```

**Better:**
```
Expertise in token optimization and performance tracking. Activate when analyzing token usage, optimizing operations, or choosing between database queries and file loading. Tracks consumption patterns and identifies optimization opportunities.
```

**Changes:**
- "Auto-activates" → "Activate"
- Remove "Enables data-driven optimization"
- More specific about what it tracks

---

### Skill 7: patterns/database-tracking-patterns

**Current:**
```
Expertise in workflow and execution tracking using the orchestr8 intelligence database. Auto-activates when creating workflows, tracking progress, managing status updates, or analyzing workflow history. Provides patterns for effective workflow lifecycle management.
```

**Better:**
```
Expertise in workflow tracking and lifecycle management. Activate when creating workflows, updating status, or analyzing execution history. Manages workflow states, progress tracking, notifications, and historical analysis.
```

**Changes:**
- "Auto-activates" → "Activate"
- Remove "Provides patterns for"
- More specific about state management

---

### Skill 8: practices/test-driven-development

**Current:**
```
Expertise in Test-Driven Development (TDD) methodology. Activate when implementing new features, fixing bugs, or refactoring code. Guides writing tests first, then implementing code to pass tests, ensuring high quality and comprehensive test coverage.
```

**Better:**
```
Expertise in Test-Driven Development methodology. Activate when implementing features, fixing bugs, or refactoring code. Follows Red-Green-Refactor cycle, writing tests first, implementing minimal code to pass, then refactoring while keeping tests green.
```

**Changes:**
- "new features" → "features"
- "Guides writing tests" → "Follows Red-Green-Refactor cycle"
- More specific about the process

---

## Priority 3: Expand TDD Skill (30 minutes)

**File:** `/Users/seth/Projects/orchestr8/.claude/skills/practices/test-driven-development/SKILL.md`

### Add Dedicated DO/DON'T Section

After line 217 (before "## When to Use TDD"), add:

```markdown
## Best Practices

### DO ✅

**TDD Process:**
- Write the smallest failing test first
- Implement minimal code to pass the test
- Refactor while tests are green
- Run tests frequently (after every change)

**Test Quality:**
- Test behavior, not implementation
- Keep tests fast (< 100ms for unit tests)
- Make tests independent (no shared state)
- Use descriptive test names that explain intent
- Test one concept per test

**Code Design:**
- Let tests drive your API design
- Use TDD to discover better abstractions
- Refactor aggressively when tests are green
- Keep production code simple

### DON'T ❌

**TDD Process:**
- Don't write all tests before implementation
- Don't skip the refactoring step
- Don't write multiple failing tests at once
- Don't ignore slow tests (optimize or move to integration)

**Test Quality:**
- Don't test private methods directly
- Don't test framework or library code
- Don't write tests that depend on execution order
- Don't mock everything (prefer real objects when simple)
- Don't test implementation details

**Code Design:**
- Don't write code before you have a failing test
- Don't keep duplicate code when refactoring
- Don't optimize prematurely (wait for tests to guide you)
- Don't mix testing concerns (unit vs integration)
```

### Add Python Examples

After the TypeScript examples around line 100, add:

```markdown
### TDD in Python

```python
# test_calculator.py
import pytest
from calculator import Calculator

class TestCalculator:
    def test_add_two_numbers(self):
        calc = Calculator()
        result = calc.add(2, 3)
        assert result == 5

    def test_subtract_two_numbers(self):
        calc = Calculator()
        result = calc.subtract(10, 4)
        assert result == 6

    def test_divide_by_zero_raises_error(self):
        calc = Calculator()
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            calc.divide(10, 0)

# Run: pytest ❌ FAIL - Calculator not implemented
```

```python
# calculator.py - Initial implementation
class Calculator:
    def add(self, a: int, b: int) -> int:
        return a + b

    def subtract(self, a: int, b: int) -> int:
        return a - b

    def divide(self, a: int, b: int) -> float:
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

# Run: pytest ✅ PASS
```
```

### Add Go Examples

Add after Python examples:

```markdown
### TDD in Go

```go
// calculator_test.go
package calculator

import "testing"

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    expected := 5

    if result != expected {
        t.Errorf("Add(2, 3) = %d; want %d", result, expected)
    }
}

func TestSubtract(t *testing.T) {
    result := Subtract(10, 4)
    expected := 6

    if result != expected {
        t.Errorf("Subtract(10, 4) = %d; want %d", result, expected)
    }
}

// Run: go test ❌ FAIL - Add/Subtract not defined
```

```go
// calculator.go
package calculator

func Add(a, b int) int {
    return a + b
}

func Subtract(a, b int) int {
    return a - b
}

// Run: go test ✅ PASS
```
```

---

## Verification Commands

After making changes, verify:

```bash
# Check frontmatter (should only see name and description)
for file in .claude/skills/patterns/database-*/SKILL.md; do
  echo "Checking: $file"
  sed -n '/^---$/,/^---$/p' "$file" | head -10
  echo ""
done

# Count lines in TDD skill (should be ~350 after expansion)
wc -l .claude/skills/practices/test-driven-development/SKILL.md

# Verify all SKILL.md files exist
find .claude/skills -type f -name "SKILL.md" | sort
```

---

## Checklist

Use this checklist when fixing:

### Phase 1: Frontmatter Fixes
- [ ] Remove autoActivationContext from database-error-learning
- [ ] Remove autoActivationContext from database-knowledge-storage
- [ ] Remove autoActivationContext from database-optimization
- [ ] Remove autoActivationContext from database-tracking-patterns
- [ ] Verify only name and description remain

### Phase 2: Description Refinements
- [ ] Update meta/agent-design-patterns description
- [ ] Update meta/plugin-architecture description
- [ ] Update meta/workflow-orchestration-patterns description
- [ ] Update patterns/database-error-learning description
- [ ] Update patterns/database-knowledge-storage description
- [ ] Update patterns/database-optimization description
- [ ] Update patterns/database-tracking-patterns description
- [ ] Update practices/test-driven-development description

### Phase 3: TDD Expansion
- [ ] Add dedicated DO/DON'T section
- [ ] Add Python examples
- [ ] Add Go examples
- [ ] Verify length is ~350 lines

### Phase 4: Verification
- [ ] Run verification commands
- [ ] Check all frontmatter has only 2 fields
- [ ] Check all descriptions follow pattern
- [ ] Commit changes with descriptive message

---

## Commit Message

After completing fixes:

```bash
git add .claude/skills/
git commit -m "fix: align skill frontmatter and descriptions with wshobson/agents patterns

- Remove autoActivationContext field from 4 database skills
- Refine all 8 skill descriptions to match wshobson pattern
- Expand TDD skill with Python/Go examples and dedicated DO/DON'T section
- All skills now comply with wshobson/agents frontmatter standards

Closes #[issue-number]"
```

---

## Time Estimates

- **Frontmatter fixes:** 5 minutes (simple deletions)
- **Description refinements:** 30 minutes (copy-paste updates)
- **TDD expansion:** 30 minutes (add examples and section)
- **Verification:** 5 minutes
- **Total:** ~70 minutes

---

## Success Criteria

After fixes, all skills should:
- ✅ Have only `name` and `description` in frontmatter
- ✅ Follow wshobson description pattern
- ✅ Have 200-400 lines of content
- ✅ Have 5+ code examples
- ✅ Have dedicated DO/DON'T sections
- ✅ Be cross-agent applicable
