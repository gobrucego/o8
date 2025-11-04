# Analysis of wshobson/agents Repository

## Research Date: 2025-11-03

## Repository: https://github.com/wshobson/agents

## Key Findings

### Their Approach vs Our Approach

**wshobson/agents:**
- 63 plugins, 85 agents, 15 workflows, 47 skills
- Plugin-based architecture (modular, install only what you need)
- Commands are **DIRECT INSTRUCTIONS** to the current Claude instance
- Commands do NOT use Task tool to delegate
- Commands say "You are a [role] expert..." and provide instructions
- Agents are loaded as context when their skills are needed

**Our orchestr8 approach:**
- Single comprehensive plugin with 72 agents, 19 workflows, 8 skills
- Hierarchical orchestration (workflows delegate to orchestrator agents)
- Workflows SHOULD use Task tool to delegate (but currently just instruct)
- Intelligence Database integration for learning and token reduction
- Goal: Autonomous multi-hour operation without context limits

### Command Structure Comparison

**wshobson command (python-scaffold.md):**
```markdown
# Python Project Scaffolding

You are a Python project architecture expert specializing in scaffolding
production-ready Python applications.

## Context
The user needs automated Python project scaffolding...

## Requirements
$ARGUMENTS

## Instructions
### 1. Analyze Project Type
Determine the project type from user requirements:
- **FastAPI**: REST APIs, microservices...
```

**Their pattern:** Command executes IN CURRENT CONTEXT. Claude reads it and follows instructions directly.

**Our pattern (what we want):**
```markdown
---
executor: "feature-orchestrator"
delegation_required: true
---

# IMMEDIATE: Use Task tool to delegate

[Delegation instructions]

---

# Instructions for Orchestrator Agent

[Full workflow with database integration]
```

**Our pattern:** Command should DELEGATE to orchestrator agent who then coordinates other agents.

### Why They Don't Need Delegation

**wshobson's model:**
1. User invokes: `/python-development:python-scaffold fastapi-microservice`
2. Claude loads the python-scaffold.md command file
3. Claude becomes a "Python project architecture expert"
4. Claude executes the scaffolding instructions directly
5. No agent delegation needed - single-agent execution

**Advantages:**
- Simpler - no delegation complexity
- Faster - no agent context switching
- Lower token usage - single context

**Disadvantages:**
- Limited to single-agent capabilities
- Can't coordinate multiple specialists
- Can't do complex multi-phase workflows autonomously

### Why We DO Need Delegation

**Our model:**
1. User invokes: `/add-feature "user authentication"`
2. Workflow should delegate to `feature-orchestrator` agent
3. Feature-orchestrator coordinates:
   - architect (design)
   - database-specialist (schema)
   - backend-developer (API)
   - frontend-developer (UI)
   - test-engineer (tests)
   - security-auditor (security)
   - code-reviewer (quality)
4. Multi-agent coordination with quality gates

**Advantages:**
- Complex workflows possible
- Specialist agents for each domain
- Quality gates enforced
- Intelligence Database tracks everything
- Can run for hours autonomously

**Disadvantages:**
- More complex delegation mechanism needed
- Higher token usage (multiple agents)
- Coordination overhead

### What We Can Learn From Them

#### 1. Plugin Architecture
They have 63 small plugins vs our 1 large plugin. Benefits:
- Users install only what they need
- Lower memory footprint
- Faster loading
- Easier to maintain

**Potential for us:** Could split orchestr8 into focused plugins:
- orchestr8-core (orchestrators + workflows)
- orchestr8-languages (language specialists)
- orchestr8-cloud (cloud providers)
- orchestr8-compliance (compliance frameworks)
- etc.

#### 2. Skills as Reusable Knowledge
They have 47 skills that activate contextually. Example:
- `./skills/api-design-principles`
- `./skills/security-best-practices`

**Potential for us:** We have 8 skills - could expand:
- Language-specific patterns (python-patterns, javascript-patterns)
- Architecture patterns (microservices, monolith, serverless)
- Security patterns (OWASP, auth, encryption)
- Testing patterns (TDD, BDD, E2E)

#### 3. Progressive Disclosure
Three-tier loading:
- Metadata (always loaded)
- Instructions (loaded on activation)
- Resources (loaded on demand)

**Potential for us:** We already do this with language pattern libraries!

#### 4. Hybrid Model Strategy
- 47 Haiku agents for fast, deterministic tasks
- 97 Sonnet agents for complex reasoning
- Pattern: Sonnet (plan) → Haiku (execute) → Sonnet (review)

**We should do this!** Currently all our agents use Sonnet.

### The Delegation Problem - Still Unsolved

**Key insight:** wshobson/agents doesn't solve our delegation problem because they DON'T DELEGATE.

Their commands execute in the current Claude context. Our workflows NEED to delegate to orchestrator agents for multi-agent coordination.

**The problem remains:**
- Workflows are markdown files (documents, not executables)
- We need workflows to AUTOMATICALLY invoke Task tool
- Current solution: Workflows instruct "you must use Task tool"
- This relies on Claude interpreting and following instructions
- Sometimes works, sometimes doesn't

### Possible Solutions Inspired by Their Approach

#### Option 1: Hybrid Model
- **Simple commands** (like scaffolding): Execute directly in current context
- **Complex workflows** (like add-feature): Delegate to orchestrator

Benefits:
- Simple tasks are fast and efficient
- Complex tasks get proper orchestration
- Best of both worlds

Implementation:
- Commands without `executor` frontmatter: Execute directly
- Commands with `executor: "agent-name"`: Auto-delegate

#### Option 2: Skill-Based Orchestration
Instead of delegating to agents, load skills into current context:

```markdown
---
skills_required:
  - feature-development
  - database-design
  - api-design
  - testing-strategy
---

# Add Feature Workflow

[Instructions that use loaded skills]
```

Benefits:
- No delegation complexity
- Skills provide specialized knowledge
- Single-context execution

Drawbacks:
- Can't use specialized tools per agent
- No parallel execution
- Higher token usage in single context

#### Option 3: Two-Tier Commands
- **Tier 1 Commands** (execute directly): Scaffolding, quick tasks
- **Tier 2 Workflows** (delegate to orchestrators): Complex multi-phase tasks

This is essentially what we have now, but we need to FIX the delegation mechanism.

### Recommendations

#### Short-term (v2.3.1)
1. **Document the two types of commands:**
   - Simple commands: Execute directly
   - Orchestration workflows: Must delegate

2. **Add strong system-level rules to `.claude/CLAUDE.md`:**
   ```markdown
   When executing a slash command:
   1. Check if file has `delegation_required: true` in frontmatter
   2. If YES: IMMEDIATELY use Task tool to delegate to executor agent
   3. If NO: Execute instructions directly in current context
   ```

3. **Test both patterns:**
   - Add a few simple commands that execute directly
   - Fix workflows to properly delegate

#### Medium-term (v2.4.0)
1. **Implement Hybrid Model Strategy:**
   - Mark some agents as Haiku (fast execution)
   - Keep orchestrators as Sonnet (planning)
   - Pattern: Sonnet plans → Haiku executes → Sonnet reviews

2. **Expand Skills Library:**
   - Add more reusable knowledge skills
   - Language patterns, architecture patterns, etc.

#### Long-term (v3.0.0)
1. **Consider Plugin Architecture:**
   - Split into focused plugins
   - Users install only what they need
   - Easier maintenance

2. **Build Workflow Execution Engine:**
   - Automatic delegation for workflows
   - No reliance on Claude interpretation
   - Proper hooks or pre-processor

### Conclusion

**What we learned:**
- wshobson/agents uses single-agent execution (no delegation)
- Their commands are direct instructions to current Claude
- They optimize with plugins, skills, and progressive disclosure
- They don't solve our delegation problem because they don't have it

**What we still need:**
- Reliable automatic delegation for workflows
- System-level enforcement (not just instructions)
- Possible solutions: hooks, pre-processor, or very strong CLAUDE.md rules

**Next steps:**
1. Implement strong delegation rules in CLAUDE.md
2. Test if Claude reliably follows them
3. If not, need to build execution engine or hooks
4. Consider adopting their hybrid model strategy (Haiku + Sonnet)
5. Consider plugin architecture for v3.0

## Additional Resources

- Repository: https://github.com/wshobson/agents
- Marketplace: 63 plugins, 85 agents, 15 workflows, 47 skills
- Architecture: Plugin-based, progressive disclosure, single-agent execution
- Our issue: Need multi-agent orchestration with reliable delegation
