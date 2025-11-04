# Exemplary Agents - Reference Patterns

These agents follow wshobson/agents patterns perfectly and should be used as templates when creating or fixing other agents.

---

## Perfect Orchestrators (2 agents)

### 1. project-orchestrator.md ⭐⭐⭐

**Why it's exemplary:**
- ✅ Opus 4 model (strategic orchestration)
- ✅ Complete tool set: Task, Read, Write, Bash, Glob, Grep, TodoWrite
- ✅ Database integration appropriate (tracks workflows)
- ✅ Clear phase-based methodology
- ✅ Agent coordination patterns documented
- ✅ Quality gate enforcement
- ✅ Context management best practices
- ✅ Error handling and recovery
- ✅ Comprehensive documentation

**Frontmatter:**
```yaml
---
name: project-orchestrator
description: Orchestrates complete end-to-end project development from requirements to deployment. Use for new projects, large features, or complex multi-domain tasks requiring coordination across multiple specialized agents.
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

**Key Patterns to Copy:**
- Task tool listed FIRST (primary function is coordination)
- Database workflow tracking with notifications
- 4-phase methodology (Planning 30%, Development 40%, QA 20%, Docs 10%)
- Quality gate validation
- Token budget management
- Parallel agent execution patterns

**Use this pattern for:** Any orchestrator that coordinates multiple agents

---

### 2. feature-orchestrator.md ⭐⭐⭐

**Why it's exemplary:**
- ✅ Opus 4 model
- ✅ Focused scope (single feature vs full project)
- ✅ Database integration for feature tracking
- ✅ Clear workflow stages
- ✅ Quality gates enforced

**Use this pattern for:** Feature-level orchestrators

---

## Perfect Specialist Agents (12 agents)

### Frontend Specialists (4 agents)

#### 1. react-specialist.md ⭐

**Why it's exemplary:**
- ✅ Perfect frontmatter (name, description, model, tools)
- ✅ NO database integration (specialist should focus on React)
- ✅ Ideal size: 460 lines
- ✅ Rich code examples (hooks, state, performance, testing)
- ✅ Clear sections: Patterns, State Management, Performance, Forms, Testing
- ✅ Best practices with DO/DON'T patterns

**Frontmatter:**
```yaml
---
name: react-specialist
description: Expert React developer specializing in React 18+, hooks, performance optimization, state management (Context, Zustand, Redux), Server Components, and modern patterns. Use for React applications, component architecture, and frontend development.
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

**Key Patterns to Copy:**
- Clear "Use when" context in description
- Tool list appropriate for specialist (Read, Write, Edit, Bash, Glob, Grep)
- NO Task tool (doesn't orchestrate)
- NO TodoWrite (doesn't track workflows)
- NO database integration
- Code examples are 20-100 lines (not full files)
- Covers: Framework patterns, testing, performance, best practices

**File Structure:**
```markdown
# Agent Title

Brief intro (1-2 sentences)

## Core Topic 1
[Code example 1]
[Code example 2]

## Core Topic 2
[Code example 3]

## Testing
[Test examples]

## Best Practices
[Tips and anti-patterns]

Closing statement
```

**Use this pattern for:** Framework specialists, library specialists

---

#### 2. nextjs-specialist.md ⭐

**Frontmatter:**
```yaml
---
name: nextjs-specialist
description: Expert Next.js developer specializing in App Router, Server Components, Server Actions, ISR, SSR, SSG, and performance optimization. Use for Next.js 14+ applications, full-stack React, and production deployments.
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

**Use this pattern for:** Meta-framework specialists

---

#### 3. vue-specialist.md ⭐

**Why it's exemplary:**
- Composition API focus
- Clear Pinia state management patterns
- TypeScript integration examples

**Use this pattern for:** Frontend framework specialists

---

#### 4. angular-specialist.md ⭐

**Why it's exemplary:**
- Angular 17+ standalone components
- Signals and reactive patterns
- RxJS best practices

**Use this pattern for:** Opinionated framework specialists

---

### API Specialists (3 agents)

#### 5. graphql-specialist.md ⭐

**Frontmatter:**
```yaml
---
name: graphql-specialist
description: Expert GraphQL developer specializing in schema design, resolvers, Apollo Server/Client, performance optimization, and federation. Use for GraphQL API design, implementation, and optimization.
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

**Use this pattern for:** API protocol specialists

---

#### 6. grpc-specialist.md ⭐

**Why it's exemplary:**
- Protocol Buffers patterns
- Service definition examples
- Performance focus

**Use this pattern for:** High-performance API specialists

---

#### 7. openapi-specialist.md ⭐

**Why it's exemplary:**
- OpenAPI 3.1 spec examples
- Code generation patterns
- Validation strategies

**Use this pattern for:** API documentation and specification specialists

---

### Data & ML Specialists (3 agents)

#### 8. data-engineer.md ⭐

**Why it's exemplary:**
- ETL pipeline patterns
- Data quality focus
- Airflow/dbt examples

**Use this pattern for:** Data pipeline specialists

---

#### 9. ml-engineer.md ⭐

**Why it's exemplary:**
- Model training patterns
- Feature engineering
- Experiment tracking

**Use this pattern for:** ML model specialists

---

#### 10. mlops-specialist.md ⭐

**Why it's exemplary:**
- Deployment patterns
- Model monitoring
- CI/CD for ML

**Use this pattern for:** ML operations specialists

---

### Mobile Specialists (2 agents)

#### 11. compose-specialist.md ⭐

**Frontmatter:**
```yaml
---
name: compose-specialist
description: Expert Jetpack Compose developer for modern Android UI. Use for Android apps with declarative UI, Material Design 3, and state management.
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

**Use this pattern for:** Mobile UI framework specialists

---

#### 12. swiftui-specialist.md ⭐

**Why it's exemplary:**
- SwiftUI patterns
- Combine integration
- iOS-specific patterns

**Use this pattern for:** Platform-specific UI specialists

---

## Common Patterns Across Perfect Agents

### Frontmatter Template

```yaml
---
name: [agent-name]                    # kebab-case, matches filename
description: Expert [role] specializing in [key technologies]. Use for [use cases] and [problem domains].
model: claude-sonnet-4-5-20250929     # Specialists use Sonnet
tools:                                 # Standard 6 tools for specialists
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

**For orchestrators:**
```yaml
---
name: [orchestrator-name]
description: Orchestrates [scope]. Use for [scenarios] requiring coordination across multiple specialized agents.
model: claude-opus-4-1-20250805       # Orchestrators use Opus
tools:
  - Task                               # FIRST - primary function
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - TodoWrite                          # For progress tracking
---
```

### Description Formula

**Specialists:**
```
Expert [role] specializing in [key tech stack]. Use for [use case 1], [use case 2], and [use case 3].
```

**Examples:**
- "Expert React developer specializing in React 18+, hooks, performance optimization. Use for React applications, component architecture, and frontend development."
- "Expert GraphQL developer specializing in schema design, resolvers, Apollo Server/Client. Use for GraphQL API design, implementation, and optimization."

**Orchestrators:**
```
Orchestrates [scope/process]. Use for [scenario] requiring coordination across multiple specialized agents.
```

**Example:**
- "Orchestrates complete end-to-end project development from requirements to deployment. Use for new projects, large features, or complex multi-domain tasks requiring coordination across multiple specialized agents."

### Tool Selection Rules

**Specialist (Read/Write):**
```yaml
tools:
  - Read      # Read existing files
  - Write     # Create new files
  - Edit      # Modify existing files
  - Bash      # Run tests, builds, tools
  - Glob      # Find files by pattern
  - Grep      # Search code
```

**Reviewer (Read-Only):**
```yaml
tools:
  - Read      # Read files to review
  - Glob      # Find files
  - Grep      # Search patterns
  - Bash      # Run analysis tools
```

**Orchestrator:**
```yaml
tools:
  - Task      # Coordinate agents (FIRST)
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - TodoWrite # Track progress
```

### Content Structure

**Specialist Agents (200-500 lines):**
```markdown
# Agent Title

Brief intro (1-2 sentences about role)

## Core Competencies
- Bullet list of technologies/skills

## [Topic 1] (e.g., "Modern Patterns")
[Code example 20-100 lines]

## [Topic 2] (e.g., "State Management")
[Code example 20-100 lines]

## [Topic 3] (e.g., "Performance")
[Code example 20-100 lines]

## Testing
[Test examples]

## Best Practices
✅ DO this
✅ DO that
❌ DON'T this
❌ DON'T that

Closing deliverables statement
```

**Orchestrator Agents (400-600 lines):**
```markdown
# Orchestrator Title

Intro and core responsibilities

## Database Integration
[Workflow tracking patterns]

## Operating Methodology

### Phase 1: [Name] (X% of time)
[Steps and patterns]

### Phase 2: [Name] (Y% of time)
[Steps and patterns]

## Agent Coordination Patterns
[How to invoke and coordinate]

## Message Passing Protocol
[Communication patterns]

## Error Handling
[Recovery strategies]

## Best Practices
DO/DON'T lists

## Context Optimization
[Token management]
```

### Database Integration Rules

**Include database integration IF:**
- ✅ Agent is an orchestrator (project-orchestrator, feature-orchestrator)
- ✅ Agent is infrastructure utility (code-intelligence-watcher, code-query, error-logger)
- ✅ Agent tracks workflows or coordinates other agents

**DO NOT include database integration if:**
- ❌ Agent is a language specialist
- ❌ Agent is a framework specialist
- ❌ Agent is a quality/testing agent (they review, don't orchestrate)
- ❌ Agent is an infrastructure specialist (they configure, don't orchestrate)
- ❌ Agent is a compliance specialist (they audit, don't orchestrate)

**Exception:** `quality/code-review-orchestrator` has database integration because it's an orchestrator.

---

## Anti-Patterns (DO NOT Copy)

### ❌ Non-Standard Frontmatter

**BAD:**
```yaml
---
name: langchain-specialist
categories: [development, ai-ml, langchain]  # NOT STANDARD
dependencies: [python-developer]             # NOT STANDARD
model: claude-sonnet-4-5-20250929
# Missing tools field!
---
```

**GOOD:**
```yaml
---
name: langchain-specialist
description: Expert LangChain developer specializing in LLM chains, agents, RAG systems. Use for building LangChain applications and RAG pipelines.
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

### ❌ Database Integration in Specialist

**BAD (from language specialists):**
```markdown
## Intelligence Database Integration

Before beginning work, source the database helper library:
```bash
source .claude/lib/db-helpers.sh
```

**Use database functions to improve code quality:**
[30-50 lines of database code]
```

**GOOD:**
```markdown
# Python Developer Agent

You are an expert Python developer...

## Core Competencies

- **Web Frameworks**: Django, FastAPI, Flask
[Continue with domain-specific content]
```

### ❌ Agent Too Verbose

**BAD:**
- 900+ lines with redundant examples
- Extensive copy-pasted patterns
- Multiple full-file examples

**GOOD:**
- 300-600 lines focused on core patterns
- 5-10 code examples, each 20-100 lines
- Essential patterns only

---

## Quick Reference Checklist

When creating or fixing an agent, verify:

### Frontmatter ✓
- [ ] `name` field matches filename (kebab-case)
- [ ] `description` follows format: "Expert [role] specializing in [tech]. Use for [cases]."
- [ ] `model` is `claude-sonnet-4-5-20250929` (or `claude-opus-4-1-20250805` for orchestrators)
- [ ] `tools` field present with 6-8 appropriate tools
- [ ] NO non-standard fields (categories, dependencies, etc.)

### Content ✓
- [ ] Clear title and intro (1-2 sentences)
- [ ] Core competencies section
- [ ] 5-10 code examples (20-100 lines each)
- [ ] Testing section (if applicable)
- [ ] Best practices with DO/DON'T
- [ ] Total length: 200-500 lines (specialists) or 400-600 lines (orchestrators)

### Database Integration ✓
- [ ] Database code ONLY if orchestrator or infrastructure utility
- [ ] NO database code in specialists
- [ ] If orchestrator: Full workflow tracking pattern included

### Tool Selection ✓
- [ ] Specialists: Read, Write, Edit, Bash, Glob, Grep (6 tools)
- [ ] Reviewers: Read, Glob, Grep, Bash (4 tools, no Write/Edit)
- [ ] Orchestrators: Task (first!), Read, Write, Bash, Glob, Grep, TodoWrite (7 tools)

### Model Selection ✓
- [ ] Orchestrators: claude-opus-4-1-20250805
- [ ] Specialists: claude-sonnet-4-5-20250929
- [ ] Strategic planning: Opus
- [ ] Tactical execution: Sonnet

---

## Usage Examples

### Creating a New Framework Specialist

**Template:**
```yaml
---
name: [framework]-specialist
description: Expert [framework] developer specializing in [version/features]. Use for [framework] applications, [use case 1], and [use case 2].
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

**Reference:** `react-specialist.md`, `nextjs-specialist.md`, `vue-specialist.md`

### Creating a New Language Specialist

**Template:**
```yaml
---
name: [language]-developer
description: Expert [language] developer specializing in [frameworks], [key features], and [use cases]. Use for [language]-specific development tasks, [domain 1], and [domain 2].
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

**Reference:** `typescript-developer.md` (after removing database integration)

### Creating a New Orchestrator

**Template:**
```yaml
---
name: [domain]-orchestrator
description: Orchestrates [process/scope]. Use for [scenario] requiring coordination across multiple specialized agents.
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

**Reference:** `project-orchestrator.md`, `feature-orchestrator.md`

---

## Final Notes

**Remember:**
1. Use these 14 exemplary agents as templates
2. Specialists should be 200-500 lines, focused on domain
3. NO database integration in specialists
4. Standard frontmatter only (name, description, model, tools)
5. Clear "Use for" context in description
6. Rich code examples, not full files
7. Best practices with DO/DON'T

**When in doubt, copy the pattern from `react-specialist.md` or `project-orchestrator.md`.**
