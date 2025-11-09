---
description: Discover patterns, anti-patterns, and refactoring opportunities in existing codebase
argument-hint: [codebase-path-or-scope]
model: claude-sonnet-4-5
---

# Discover Patterns Workflow

## ⚠️ CRITICAL: Autonomous Orchestration Required

**DO NOT execute this workflow in the main Claude Code context.**

You MUST immediately delegate this entire workflow to the pattern-learner agent using the Task tool.

**Delegation Instructions:**
```
This pattern discovery workflow uses the pattern-learner specialist to analyze codebases systematically.

Primary agent: pattern-learner
Supporting agents: code-reviewer, architect

Execute the discover-patterns workflow for: [user's codebase path/scope].

Perform systematic pattern discovery:
1. Analyze codebase structure and identify patterns (25%)
2. Classify patterns (design patterns, architectural patterns, code patterns) (25%)
3. Identify anti-patterns and code smells (25%)
4. Generate refactoring opportunities and pattern library (25%)

Follow all phases, use pattern-learner specialist, and meet success criteria defined below."
```

**After delegation:**
- Pattern-learner agent works autonomously through codebase analysis
- Return to main context only when complete
- Do NOT attempt to execute workflow steps in main context

---

## Pattern Discovery Instructions for Orchestrator

Systematic workflow for discovering patterns, anti-patterns, and architectural insights from existing codebases.

## Intelligence Database Integration

```bash
# Initialize workflow
echo "🔍 Starting Pattern Discovery Workflow"
echo "Codebase Scope: $1"

# Query knowledge base for known patterns in similar codebases
```

---

## Phase 1: Codebase Analysis & Pattern Identification (0-25%)

**⚡ EXECUTE TASK TOOL:**
```
Use the pattern-learner agent to:
1. Analyze codebase structure and organization
2. Identify recurring patterns across the code
3. Map architectural patterns in use
4. Catalog design patterns found
5. Document coding conventions and idioms

subagent_type: "orchestr8:research:pattern-learner"
description: "Analyze codebase and identify patterns"
prompt: "Discover patterns in codebase: $1

Tasks:
1. **Codebase Structure Analysis**
   - Map directory structure and organization
   - Identify module boundaries and dependencies
   - Analyze file naming conventions
   - Understand build/packaging structure
   - Document technology stack used

2. **Architectural Pattern Identification**
   - Identify overall architecture (MVC, layered, microservices, etc.)
   - Find architectural patterns in use:
     * Layered architecture
     * Microservices
     * Event-driven architecture
     * CQRS/Event Sourcing
     * Domain-Driven Design
     * Clean Architecture
   - Document architectural decisions visible in code

3. **Design Pattern Discovery**
   - Scan for Gang of Four patterns:
     * Creational: Singleton, Factory, Builder, Prototype
     * Structural: Adapter, Decorator, Facade, Proxy
     * Behavioral: Observer, Strategy, Command, Template Method
   - Find application-specific patterns
   - Identify pattern usage frequency

4. **Code Pattern Analysis**
   - Recurring code structures
   - Common idioms and conventions
   - Naming patterns
   - Error handling patterns
   - Data access patterns
   - API design patterns

5. **Dependency and Coupling Analysis**
   - Module dependencies
   - Coupling levels between components
   - Identify tight coupling vs loose coupling
   - Find circular dependencies

Expected outputs:
- .orchestr8/docs/patterns/codebase-analysis-YYYY-MM-DD.md
- .orchestr8/docs/patterns/architectural-patterns-YYYY-MM-DD.md
- .orchestr8/docs/patterns/design-patterns-YYYY-MM-DD.md
- .orchestr8/docs/patterns/code-patterns-YYYY-MM-DD.md
- .orchestr8/docs/patterns/dependency-graph-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/patterns/codebase-analysis-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/architectural-patterns-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/design-patterns-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/code-patterns-YYYY-MM-DD.md`

---

## Phase 2: Pattern Classification & Documentation (25-50%)

**⚡ EXECUTE TASK TOOL:**
```
Use the pattern-learner agent to:
1. Classify discovered patterns by category
2. Document each pattern with examples
3. Assess pattern quality (well-implemented vs problematic)
4. Identify pattern consistency across codebase
5. Create pattern catalog

subagent_type: "orchestr8:research:pattern-learner"
description: "Classify and document discovered patterns"
prompt: "Classify and document patterns found in analysis:

Input: .orchestr8/docs/patterns/*-patterns-*.md

Tasks:
1. **Pattern Classification**
   - Group by category (architectural, design, code, testing, etc.)
   - Rank by frequency of use
   - Identify primary vs secondary patterns
   - Note pattern variations found

2. **Pattern Documentation**
   For each significant pattern:
   - Pattern name
   - Category
   - Intent/purpose
   - Code examples from codebase
   - Where it's used (file references)
   - Frequency of use
   - Quality assessment (well/poorly implemented)

3. **Pattern Quality Assessment**
   - Well-implemented patterns (follow best practices)
   - Partially-implemented patterns (incomplete or inconsistent)
   - Misused patterns (incorrect application)
   - Missing patterns (where pattern would help but isn't used)

4. **Consistency Analysis**
   - Are patterns applied consistently?
   - Identify variations in implementation
   - Find inconsistencies that cause confusion

Expected outputs:
- .orchestr8/docs/patterns/pattern-catalog-YYYY-MM-DD.md
- .orchestr8/docs/patterns/pattern-quality-assessment-YYYY-MM-DD.md
- .orchestr8/docs/patterns/consistency-analysis-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/patterns/pattern-catalog-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/pattern-quality-assessment-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/consistency-analysis-YYYY-MM-DD.md`

---

## Phase 3: Anti-Pattern & Code Smell Detection (50-75%)

**⚡ EXECUTE TASK TOOL:**
```
Use the code-reviewer agent to:
1. Identify anti-patterns in architecture and code
2. Detect code smells systematically
3. Find technical debt and design issues
4. Assess severity and impact of each issue
5. Prioritize anti-patterns for refactoring

subagent_type: "orchestr8:quality:code-reviewer"
description: "Identify anti-patterns and code smells"
prompt: "Identify anti-patterns and code smells in codebase: $1

Input: Pattern analysis from previous phases

Tasks:
1. **Architectural Anti-Patterns**
   - God Object / Big Ball of Mud
   - Spaghetti Code
   - Lava Flow (dead code that accumulates)
   - Golden Hammer (overuse of one pattern)
   - Vendor Lock-in
   - Circular Dependencies

2. **Design Anti-Patterns**
   - Singleton Overuse
   - Anemic Domain Model
   - Magic Numbers/Strings
   - Hard Coding
   - Copy-Paste Programming
   - Shotgun Surgery (changes require many edits)

3. **Code Smells**
   - Long Methods (>50 lines)
   - Large Classes (>500 lines)
   - Long Parameter Lists (>5 params)
   - Duplicated Code
   - Feature Envy
   - Inappropriate Intimacy
   - Data Clumps
   - Primitive Obsession

4. **Technical Debt Assessment**
   - Categorize by severity (critical/high/medium/low)
   - Estimate refactoring effort
   - Assess business impact
   - Calculate technical debt ratio

5. **Prioritization**
   - High-impact, low-effort fixes (quick wins)
   - Critical issues (must fix soon)
   - Long-term improvements (plan for sprints)

Expected outputs:
- .orchestr8/docs/patterns/anti-patterns-YYYY-MM-DD.md
- .orchestr8/docs/patterns/code-smells-YYYY-MM-DD.md
- .orchestr8/docs/patterns/technical-debt-YYYY-MM-DD.md
- .orchestr8/docs/patterns/refactoring-priorities-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/patterns/anti-patterns-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/code-smells-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/technical-debt-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/refactoring-priorities-YYYY-MM-DD.md`

---

## Phase 4: Refactoring Opportunities & Pattern Library (75-100%)

**⚡ EXECUTE TASK TOOL:**
```
Use the architect agent to:
1. Generate refactoring recommendations
2. Create organizational pattern library
3. Document best practices discovered
4. Provide improvement roadmap
5. Capture reusable knowledge

subagent_type: "orchestr8:development:architect"
description: "Generate refactoring plan and pattern library"
prompt: "Create refactoring opportunities and pattern library:

Input: All pattern analysis from previous phases

Tasks:
1. **Refactoring Opportunities**
   - List concrete refactoring tasks
   - Group by area/module
   - Estimate effort for each
   - Define success criteria
   - Suggest refactoring patterns to apply

2. **Pattern Library Creation**
   - Document well-implemented patterns as templates
   - Create reusable pattern examples
   - Write pattern application guidelines
   - Include anti-pattern warnings
   - Add code examples and best practices

3. **Best Practices Documentation**
   - Architectural guidelines
   - Design pattern recommendations
   - Coding conventions to adopt
   - Testing patterns to follow
   - Performance patterns discovered

4. **Improvement Roadmap**
   - Phase 1: Critical fixes (anti-patterns causing issues)
   - Phase 2: High-value refactorings (improves maintainability)
   - Phase 3: Long-term improvements (reduces technical debt)
   - Timeline and resource estimates

5. **Knowledge Capture**
   - Store pattern library in knowledge base
   - Document organizational conventions
   - Preserve architectural decisions
   - Create searchable pattern catalog

Expected outputs:
- .orchestr8/docs/patterns/refactoring-opportunities-YYYY-MM-DD.md
- .orchestr8/docs/patterns/pattern-library-YYYY-MM-DD.md
- .orchestr8/docs/patterns/best-practices-YYYY-MM-DD.md
- .orchestr8/docs/patterns/improvement-roadmap-YYYY-MM-DD.md
- .orchestr8/docs/knowledge/pattern-library-[project]-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/patterns/refactoring-opportunities-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/pattern-library-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/best-practices-YYYY-MM-DD.md`
- `.orchestr8/docs/patterns/improvement-roadmap-YYYY-MM-DD.md`
- `.orchestr8/docs/knowledge/pattern-library-*.md`

---

## Workflow Completion

```bash
echo "
✅ PATTERN DISCOVERY WORKFLOW COMPLETE

Codebase Analyzed: $1

Discovery Process:
✅ Analyzed codebase structure and organization
✅ Identified architectural and design patterns
✅ Detected anti-patterns and code smells
✅ Generated refactoring opportunities
✅ Created organizational pattern library

Deliverables Created:
- Codebase analysis and structure map
- Architectural pattern catalog
- Design pattern inventory
- Code pattern documentation
- Anti-pattern and code smell report
- Technical debt assessment
- Refactoring priorities and opportunities
- Best practices guide
- Improvement roadmap
- Reusable pattern library

Key Artifacts:
- .orchestr8/docs/patterns/pattern-catalog-YYYY-MM-DD.md
- .orchestr8/docs/patterns/anti-patterns-YYYY-MM-DD.md
- .orchestr8/docs/patterns/refactoring-opportunities-YYYY-MM-DD.md
- .orchestr8/docs/patterns/pattern-library-YYYY-MM-DD.md
- .orchestr8/docs/patterns/improvement-roadmap-YYYY-MM-DD.md

Patterns Discovered: [Count]
Anti-Patterns Found: [Count]
Refactoring Opportunities: [Count]

Next Steps:
1. Review pattern catalog and anti-patterns
2. Prioritize refactoring opportunities
3. Adopt best practices from pattern library
4. Begin Phase 1 of improvement roadmap
5. Track progress on technical debt reduction
"
```

---

## Success Criteria

Pattern discovery is complete when:
- ✅ Codebase analyzed comprehensively
- ✅ Patterns identified and cataloged
- ✅ Anti-patterns and code smells documented
- ✅ Technical debt assessed
- ✅ Refactoring opportunities prioritized
- ✅ Pattern library created
- ✅ Best practices documented
- ✅ Improvement roadmap defined
- ✅ Knowledge captured for reuse

---

## Example Usage

### Example 1: Legacy Codebase Analysis
```
/orchestr8:discover-patterns "./src"

Discoveries:
- 15 design patterns found (Singleton heavily overused)
- Layered architecture (MVC-ish but inconsistent)
- 23 anti-patterns identified
- 156 code smells detected
- Technical debt ratio: 35% (high)

Recommendations:
- Refactor God Objects in /src/services
- Reduce Singleton usage (12 → 3)
- Extract repeated code (45% duplication)
- Improve test coverage (current: 32%)

Roadmap: 8 weeks to address critical issues
```

### Example 2: Modern React App
```
/orchestr8:discover-patterns "./src/components"

Discoveries:
- Component patterns: Container/Presentational (good)
- State management: Redux + Context (mixed, causes confusion)
- Custom hooks pattern (well-implemented)
- Prop drilling anti-pattern (7 components deep)
- Performance issues: Unnecessary re-renders

Recommendations:
- Standardize on Zustand (replace Redux + Context)
- Fix prop drilling with composition
- Add React.memo for expensive components
- Create shared component library

Quick wins: 2 weeks
```

---

## Anti-Patterns to Avoid

❌ Don't just list patterns without examples
❌ Don't ignore anti-patterns (they're valuable lessons)
❌ Don't skip prioritization (everything can't be fixed at once)
❌ Don't forget to capture knowledge
❌ Don't create pattern library that won't be maintained

✅ DO provide concrete code examples
✅ DO document why patterns exist in the codebase
✅ DO prioritize refactoring by impact
✅ DO create actionable improvement roadmap
✅ DO capture patterns for organizational reuse

---

## Notes

- Pattern discovery is valuable for onboarding new team members
- Creates institutional knowledge capture
- Identifies refactoring opportunities systematically
- Builds organizational pattern library
- Helps maintain consistency across projects

**Remember:** Patterns are discoveries, not prescriptions. The goal is to understand what works (and doesn't work) in your specific context.
