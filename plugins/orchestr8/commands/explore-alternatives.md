---
description: Multi-approach exploration workflow for discovering optimal solutions through parallel experimentation
argument-hint: [problem-or-goal]
model: claude-sonnet-4-5
---

# Explore Alternatives Workflow

## ⚠️ CRITICAL: Autonomous Orchestration Required

**DO NOT execute this workflow in the main Claude Code context.**

You MUST immediately delegate this entire workflow to specialized exploration agents using the Task tool.

**Delegation Instructions:**
```
This exploration workflow coordinates multiple specialized agents in parallel to discover and evaluate solution alternatives.

Primary orchestrator: general-purpose agent
Exploration specialists used: code-researcher, pattern-experimenter, architect, performance-researcher

Execute the explore-alternatives workflow for: [user's problem or goal].

Perform systematic alternative exploration:
1. Frame problem and discover diverse alternatives (20%)
2. Explore all alternatives in parallel with prototypes (45%)
3. Perform multi-criteria evaluation (20%)
4. Generate recommendation and implementation roadmap (15%)

Follow all phases, champion parallelism, enforce quality gates, and meet success criteria defined below."
```

**After delegation:**
- Exploration agents work autonomously through discovery
- Parallel execution for 3-5x speedup
- Return to main context only when complete or if user input required
- Do NOT attempt to execute workflow steps in main context

---

## Explore Alternatives Workflow Instructions for Orchestrator

Comprehensive exploration workflow for discovering and evaluating multiple solution approaches in parallel, optimizing for the best outcome across multiple dimensions.

## Intelligence Database Integration

```bash
# Initialize workflow
echo "🔍 Starting Explore Alternatives Workflow"
echo "Problem/Goal: $1"

# Query similar exploration patterns from knowledge base
# Check for prior solutions to similar problems
```

---

## Phase 1: Problem Framing & Solution Discovery (0-20%)

**⚡ EXECUTE TASK TOOL:**
```
Use the code-researcher or architect agent to:
1. Deeply analyze the problem or goal
2. Generate diverse solution alternatives (5-10 ideas)
3. Apply creative discovery techniques
4. Filter to top 4-6 alternatives for deep exploration
5. Define comprehensive evaluation framework

subagent_type: "orchestr8:research:code-researcher"
description: "Frame problem and discover solution alternatives"
prompt: "Discover and analyze alternatives for problem: $1

Tasks:
1. **Problem Analysis**
   - Parse problem statement or goal clearly
   - Identify constraints and requirements
   - Define success criteria (measurable outcomes)
   - Establish evaluation dimensions
   - Identify non-functional requirements (performance, cost, complexity)

2. **Solution Space Exploration**
   - Brainstorm diverse approaches (aim for 8-12 initial ideas)
   - Research existing solutions in this domain
   - Consider unconventional alternatives (think outside the box)
   - Look at solutions from adjacent domains (cross-pollination)
   - Generate alternatives using multiple strategies:
     * **Analogical:** What solutions exist in similar domains?
     * **Combinatorial:** Can we combine existing approaches?
     * **Constraint Relaxation:** What if we removed constraint X?
     * **Extreme Thinking:** What would extreme solutions look like?
     * **Pattern-Based:** Which design patterns or architectural patterns apply?

3. **Alternative Generation Strategies**
   - Technology-based: Different tech stacks
   - Architecture-based: Different patterns (monolith, microservices, serverless, etc.)
   - Algorithm-based: Different algorithms or data structures
   - Process-based: Different workflows or methodologies
   - Hybrid: Combinations of approaches

4. **Initial Filtering**
   - Eliminate obviously infeasible approaches
   - Group similar alternatives
   - Identify most promising 4-6 alternatives for deep exploration
   - Document why others were filtered out

5. **Evaluation Framework**
   - Define comparison dimensions:
     * Performance (speed, throughput, latency)
     * Implementation complexity (LOC, concepts, learning curve)
     * Cost (infrastructure, development time, licensing)
     * Maintainability (debugging ease, operational burden)
     * Risk (technical risk, business risk, team capability)
     * Scalability (growth potential)
   - Weight criteria by business importance (must sum to 100%)
   - Define scoring methodology (0-10 scale)

Expected outputs:
- .orchestr8/docs/research/alternatives/problem-analysis-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/solution-space-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/alternatives/ - One file per alternative
  * alternative-1-[name].md
  * alternative-2-[name].md
  * alternative-3-[name].md
  * alternative-4-[name].md
- .orchestr8/docs/research/alternatives/evaluation-framework-YYYY-MM-DD.md

Example Problem Analysis:
---
# Problem: Optimize API Response Time

## Current Situation
- API p95 latency: 500ms
- Need: <100ms p95 latency
- Load: 5k requests/sec peak
- Bottleneck: Database queries (400ms average)

## Constraints
- Cannot change database technology (PostgreSQL)
- Budget: $2k/month additional infrastructure
- Team: 3 backend developers
- Timeline: 4 weeks to implement

## Success Criteria
- p95 latency <100ms
- Maintain 5k req/sec throughput
- No data consistency issues
- Cost within budget
- Timeline met

## Evaluation Dimensions
1. Performance improvement (35%)
2. Implementation complexity (20%)
3. Cost (15%)
4. Maintainability (15%)
5. Risk (15%)
---

Example Alternative:
---
# Alternative 2: Redis Caching Layer

**Approach:** Cache frequent queries with TTL

**Rationale:** Reduce database load for read-heavy workload

**Expected Impact:** 80-90% latency reduction for cache hits

**Complexity:** Medium (cache invalidation logic)

**Cost:** $200/month (ElastiCache)

**Risk:** Medium (cache invalidation bugs, stale data)

**Pros:**
- Dramatic performance improvement
- Battle-tested technology
- Team has Redis experience

**Cons:**
- Cache invalidation complexity
- Only helps cacheable queries
- Additional infrastructure

**Feasibility:** High
---
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/alternatives/problem-analysis-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/solution-space-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/alternatives/` - Alternative descriptions
- `.orchestr8/docs/research/alternatives/evaluation-framework-YYYY-MM-DD.md`

**Quality Gate: Solution Discovery Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

ALTERNATIVES_DIR=$(get_orchestr8_path "research/alternatives" "alternatives")

# Validate alternatives directory exists
if [ ! -d "$ALTERNATIVES_DIR" ]; then
  echo "❌ Alternatives directory not created"
  exit 1
fi

# Count alternatives (should be 4-6 for deep exploration)
ALT_COUNT=$(find "$ALTERNATIVES_DIR" -name "alternative-*.md" | wc -l)
if [ "$ALT_COUNT" -lt 3 ]; then
  echo "❌ Too few alternatives: $ALT_COUNT (need 3-6)"
  exit 1
fi

if [ "$ALT_COUNT" -gt 7 ]; then
  echo "⚠️ Warning: Many alternatives ($ALT_COUNT), exploration may take long time"
fi

# Check for evaluation framework
EVAL_FRAMEWORK=$(find "$(get_orchestr8_path 'research/alternatives')" -name "evaluation-framework-*.md" | head -1)
if [ ! -f "$EVAL_FRAMEWORK" ]; then
  echo "❌ Evaluation framework not defined"
  exit 1
fi

echo "✅ Discovered ${ALT_COUNT} alternatives with evaluation framework"
```

---

## Phase 2: Parallel Alternative Exploration (20-65%)

**🚀 PARALLEL EXECUTION REQUIRED:** This is the core value proposition. Execute all alternative explorations IN PARALLEL using multiple Task calls in a SINGLE MESSAGE for maximum speed (4-6x speedup). Each exploration agent works independently with isolated resources and outputs to separate files (no conflicts).

**For EACH alternative, launch a deep exploration in parallel:**

### Alternative 1 Exploration

**⚡ EXECUTE TASK TOOL (in parallel with others):**
```
Select appropriate specialist based on alternative type:
- Architecture alternative → architect agent
- Performance alternative → performance-researcher agent
- Algorithm alternative → language specialist
- Technology alternative → code-researcher or technology specialist
- Pattern alternative → pattern-experimenter agent

subagent_type: "[orchestr8:research:code-researcher|orchestr8:research:pattern-experimenter|orchestr8:development:architect|orchestr8:research:performance-researcher]"
description: "Explore Alternative 1 with prototype and analysis"
prompt: "Deeply explore alternative from: .orchestr8/docs/research/alternatives/alternatives/alternative-1-*.md

Evaluation framework: .orchestr8/docs/research/alternatives/evaluation-framework-*.md

Tasks:
1. **Prototype Development**
   - Implement minimal viable version (proof-of-concept)
   - Focus on critical aspects that differentiate this alternative
   - Use representative data (realistic scale)
   - Apply best practices for this approach
   - Keep scope minimal but realistic

2. **Empirical Testing**
   - Performance benchmarking (if performance-relevant)
   - Load testing (if scalability-relevant)
   - Edge case testing
   - Failure mode testing
   - Resource utilization measurement

3. **Qualitative Assessment**
   - Implementation complexity (LOC, new concepts, learning curve)
   - Code maintainability (clarity, debugging ease)
   - Developer experience (API ergonomics, tooling)
   - Operational complexity (deployment, monitoring)
   - Documentation quality (available resources)

4. **Cost Analysis**
   - Infrastructure costs (compute, storage, services)
   - Development time (estimate based on complexity)
   - Ongoing maintenance costs
   - Training requirements
   - Licensing (if applicable)

5. **Risk Evaluation**
   - Technical risks (unknowns, complexity, dependencies)
   - Operational risks (reliability, debugging, scaling)
   - Business risks (vendor lock-in, team capability)
   - Mitigation strategies for identified risks

6. **Scoring Against Framework**
   - Score on each evaluation dimension (0-10 scale)
   - Provide evidence for each score
   - Compare to baseline or status quo
   - Document assumptions

Expected outputs:
- .orchestr8/docs/research/alternatives/explorations/alternative-1-[name]/
  * prototype/ - Proof-of-concept code
  * benchmarks.md - Performance results (if applicable)
  * analysis.md - Deep dive analysis
  * trade-offs.md - Pros and cons
  * scores.md - Evaluation scores with evidence
  * recommendation.md - Viability assessment

CRITICAL: Use separate output directory for this alternative to avoid conflicts during parallel execution.

Exploration Depth:
- **High Promise:** Full prototype + comprehensive testing
- **Medium Promise:** Focused prototype + targeted testing
- **Low Promise:** Analytical assessment + minimal proof-of-concept

Example Prototype (Redis Caching):
---
import redis
import json

cache = redis.Redis(host='localhost', decode_responses=True)

def cached(ttl=300):
    def decorator(func):
        def wrapper(*args, **kwargs):
            key = f\"{func.__name__}:{json.dumps(args)}\"
            cached_result = cache.get(key)
            if cached_result:
                return json.loads(cached_result)

            result = func(*args, **kwargs)
            cache.setex(key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cached(ttl=60)
def get_user_dashboard(user_id):
    # Expensive DB query here
    pass

# Benchmarks:
# Without cache: 450ms avg
# With cache hit: 3ms avg
# Cache hit rate: 87%
# Effective p95: 72ms ✅
---
"
```

### Alternative 2 Exploration (PARALLEL)
### Alternative 3 Exploration (PARALLEL)
### Alternative 4 Exploration (PARALLEL)
### Alternative 5 Exploration (PARALLEL - if exists)
### Alternative 6 Exploration (PARALLEL - if exists)

**[Repeat same pattern for each alternative with different output paths]**

**⚠️ ORCHESTRATION NOTE:**
```
Launch ALL alternative explorations in a SINGLE MESSAGE with multiple Task tool calls.

Example for 5 alternatives:
- Single message containing 5 Task tool uses
- Each Task explores one alternative deeply
- All execute simultaneously with isolated resources
- Each writes to separate exploration directory
- Total time = longest exploration (not sum of all)

Speed advantage:
- Sequential: 5 alternatives × 3 hours = 15 hours
- Parallel: 5 alternatives in parallel = 3 hours (5x speedup)
```

**Expected Outputs (for all alternatives):**
- `.orchestr8/docs/research/alternatives/explorations/alternative-1-[name]/`
  - `prototype/` - Code
  - `benchmarks.md`
  - `analysis.md`
  - `trade-offs.md`
  - `scores.md`
- `.orchestr8/docs/research/alternatives/explorations/alternative-2-[name]/` (same)
- [Additional alternatives...]

**Quality Gate: Exploration Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

EXPLORATIONS_DIR=$(get_orchestr8_path "research/alternatives" "explorations")

# Validate all explorations exist
EXPLORATION_COUNT=$(find "$EXPLORATIONS_DIR" -type d -name "alternative-*" | wc -l)
if [ "$EXPLORATION_COUNT" -lt 3 ]; then
  echo "❌ Missing explorations: found $EXPLORATION_COUNT, expected 3+"
  exit 1
fi

# Validate each exploration has analysis
for alt_dir in "$EXPLORATIONS_DIR"/alternative-*; do
  if [ ! -f "$alt_dir/analysis.md" ]; then
    echo "❌ Missing analysis: $alt_dir"
    exit 1
  fi

  if [ ! -f "$alt_dir/scores.md" ]; then
    echo "❌ Missing scores: $alt_dir"
    exit 1
  fi
done

echo "✅ All ${EXPLORATION_COUNT} alternatives explored with prototypes and analysis"
```

---

## Phase 3: Multi-Criteria Evaluation (65-85%)

**⚡ EXECUTE TASK TOOL:**
```
Use the code-researcher agent to:
1. Aggregate exploration results
2. Create multi-criteria decision matrix
3. Perform trade-off analysis
4. Identify Pareto-optimal solutions
5. Conduct sensitivity analysis
6. Generate scenario-based recommendations

subagent_type: "orchestr8:research:code-researcher"
description: "Evaluate alternatives systematically across criteria"
prompt: "Perform comprehensive multi-criteria evaluation:

Input files:
- .orchestr8/docs/research/alternatives/explorations/alternative-*/
- .orchestr8/docs/research/alternatives/evaluation-framework-*.md

Tasks:
1. **Data Normalization**
   - Aggregate results from all alternative explorations
   - Normalize metrics for fair comparison (e.g., all to 0-10 scale)
   - Handle missing data appropriately
   - Validate data consistency

2. **Multi-Criteria Scoring**
   - Score each alternative on each dimension
   - Apply dimension weights from evaluation framework
   - Calculate overall weighted scores
   - Rank alternatives by total score
   - Identify significant vs marginal score differences

3. **Trade-off Analysis**
   - Performance vs complexity trade-offs
   - Cost vs capabilities trade-offs
   - Short-term vs long-term considerations
   - Flexibility vs simplicity
   - Identify no-free-lunch scenarios

4. **Pareto Analysis**
   - Identify Pareto-optimal solutions (not dominated by others)
   - Identify dominated solutions (strictly worse than another)
   - Explain why certain solutions are/aren't on Pareto frontier

5. **Sensitivity Analysis**
   - How do rankings change with different weights?
   - Which alternatives are robust to weight changes?
   - Which are sensitive to specific assumptions?
   - Identify decision boundaries

6. **Scenario-Based Recommendations**
   - Best alternative if performance is critical
   - Best if cost is constrained
   - Best if time is limited
   - Best for specific use cases
   - Best for different team sizes/skills
   - Hybrid approaches to consider

Expected outputs:
- .orchestr8/docs/research/alternatives/evaluation/scoring-matrix-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/evaluation/trade-offs-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/evaluation/pareto-analysis-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/evaluation/sensitivity-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/evaluation/scenarios-YYYY-MM-DD.md

Scoring Matrix Format:
| Criterion | Weight | Alt1 | Alt2 | Alt3 | Alt4 | Alt5 |
|-----------|--------|------|------|------|------|------|
| Performance | 35% | 6.0 | 9.0 | 7.0 | 9.0 | 10.0 |
| Complexity | 20% | 9.0 | 7.0 | 5.0 | 6.0 | 4.0 |
| Cost | 15% | 10.0 | 9.0 | 4.0 | 10.0 | 7.0 |
| Maintainability | 15% | 8.0 | 6.0 | 5.0 | 7.0 | 5.0 |
| Risk | 15% | 9.0 | 7.0 | 6.0 | 7.0 | 6.0 |
| **Weighted Total** | | **7.85** | **7.95** | **6.05** | **7.85** | **7.45** |
| **Rank** | | 3 | 1 | 5 | 3 | 4 |

Winner: Alternative 2 (score: 7.95)
Runner-up: Alternatives 1 & 4 (tied at 7.85)
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/alternatives/evaluation/scoring-matrix-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/evaluation/trade-offs-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/evaluation/pareto-analysis-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/evaluation/sensitivity-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/evaluation/scenarios-YYYY-MM-DD.md`

**Quality Gate: Evaluation Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

EVAL_DIR=$(get_orchestr8_path "research/alternatives" "evaluation")
SCORING_MATRIX=$(find "$EVAL_DIR" -name "scoring-matrix-*.md" | head -1)

# Validate scoring matrix exists
if [ ! -f "$SCORING_MATRIX" ]; then
  echo "❌ Scoring matrix not created"
  exit 1
fi

# Check for weighted scores
if ! grep -qE "Weighted Total|Overall Score" "$SCORING_MATRIX"; then
  echo "❌ Missing weighted scores in matrix"
  exit 1
fi

# Check for winner identification
if ! grep -qE "Winner|Rank.*1|Best" "$SCORING_MATRIX"; then
  echo "⚠️ Warning: No clear winner identified"
fi

echo "✅ Multi-criteria evaluation complete with scoring matrix"
```

---

## Phase 4: Recommendation & Implementation Roadmap (85-100%)

**⚡ EXECUTE TASK TOOL:**
```
Use the general-purpose agent to:
1. Formulate primary recommendation with evidence
2. Create scenario-based guidance
3. Build phased implementation roadmap
4. Document decision rationale (ADR)
5. Develop risk mitigation plan
6. Capture knowledge for future use

subagent_type: "general-purpose"
description: "Generate recommendation and implementation plan"
prompt: "Create final recommendation and implementation materials:

Input files:
- .orchestr8/docs/research/alternatives/evaluation/scoring-matrix-*.md
- .orchestr8/docs/research/alternatives/explorations/alternative-*/

Tasks:
1. **Primary Recommendation**
   - Identify top-ranked alternative
   - Justify selection with empirical evidence
   - Reference specific metrics and scores
   - Acknowledge limitations and trade-offs
   - Define success metrics for implementation
   - Explain why this beats alternatives

2. **Scenario-Based Guidance**
   - "If performance is critical..." → Alternative X
   - "If budget is constrained..." → Alternative Y
   - "If time is limited..." → Alternative Z
   - "For small teams..." → Alternative A
   - "For large scale..." → Alternative B
   - Conditions that would change recommendation
   - Hybrid approaches to consider

3. **Implementation Roadmap**
   - **Phase 1:** Quick wins or foundational work
     * What to implement first
     * Timeline estimate
     * Resource requirements
   - **Phase 2:** Core implementation
     * Main alternative deployment
     * Integration points
     * Testing strategy
   - **Phase 3:** Advanced optimizations (optional)
     * Performance tuning
     * Additional features
     * Hybrid improvements
   - Risk mitigation at each phase

4. **Architecture Decision Record (ADR)**
   - Title: Decision on [problem]
   - Context: Why we explored alternatives
   - Options considered: All alternatives evaluated
   - Decision: Chosen alternative with rationale
   - Consequences: Expected outcomes and trade-offs
   - Date and participants

5. **Risk Mitigation Plan**
   - For each identified risk:
     * Probability and impact
     * Mitigation strategy
     * Contingency plan
     * Monitoring approach
     * Rollback procedure

6. **Knowledge Capture**
   - Store in .orchestr8/docs/knowledge/
   - Alternative comparison decision record
   - Performance baselines established
   - Lessons learned from exploration
   - Reusable patterns discovered

Expected outputs:
- .orchestr8/docs/research/alternatives/recommendation-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/scenario-guide-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/implementation-roadmap-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/risk-mitigation-YYYY-MM-DD.md
- .orchestr8/docs/knowledge/alternative-exploration-[topic]-YYYY-MM-DD.md (ADR)

Example Recommendation:
---
# Recommendation: Phased Approach

## Primary Recommendation: Alternative 2 (Redis Caching)

**Score:** 7.95/10 (highest)

**Evidence:**
- Performance: 9/10 (95% latency reduction on cache hits)
- Cost: 9/10 ($200/month, within budget)
- Achieves <100ms p95 target ✅
- Team has Redis experience (low risk)
- Battle-tested technology

**Why Not Alternatives:**
- Alternative 1 (Query Opt): Good but only 60% improvement
- Alternative 3 (Replicas): Higher cost ($800/mo), replication lag
- Alternative 5 (Hybrid): Unnecessary complexity for now

## Phased Implementation

**Phase 1 (Week 1): Foundation**
- Implement Alternative 1 (query optimization) first
- Zero cost, low risk, 60% improvement
- Expected: 500ms → 200ms p95

**Phase 2 (Weeks 2-3): Caching**
- Add Alternative 2 (Redis caching)
- Build on query optimizations
- Expected: 200ms → 40ms p95 ✅

**Phase 3 (Future): Advanced**
- Only if Phase 2 insufficient
- Consider hybrid approaches
- Re-evaluate based on Phase 2 results

## Success Metrics
- p95 latency <100ms ✅
- Cache hit rate >80%
- Cost <$2k/month ✅
- Zero data consistency issues
- Implemented in 4 weeks ✅
---
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/alternatives/recommendation-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/scenario-guide-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/implementation-roadmap-YYYY-MM-DD.md`
- `.orchestr8/docs/research/alternatives/risk-mitigation-YYYY-MM-DD.md`
- `.orchestr8/docs/knowledge/alternative-exploration-*.md` (ADR)

**Quality Gate: Recommendation Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

ALTERNATIVES_DIR=$(get_orchestr8_path "research" "alternatives")
RECOMMENDATION=$(find "$ALTERNATIVES_DIR" -name "recommendation-*.md" | head -1)
ROADMAP=$(find "$ALTERNATIVES_DIR" -name "implementation-roadmap-*.md" | head -1)

# Validate recommendation exists
if [ ! -f "$RECOMMENDATION" ]; then
  echo "❌ Recommendation not created"
  exit 1
fi

# Validate roadmap exists
if [ ! -f "$ROADMAP" ]; then
  echo "❌ Implementation roadmap not created"
  exit 1
fi

# Check for evidence-based decision
if ! grep -qE "evidence|data|score|benchmark" "$RECOMMENDATION"; then
  echo "⚠️ Warning: Recommendation may lack empirical evidence"
fi

echo "✅ Recommendation complete with implementation roadmap"
```

---

## Workflow Completion

```bash
# Calculate total time
WORKFLOW_END=$(date +%s)

echo "
✅ EXPLORE ALTERNATIVES WORKFLOW COMPLETE

Problem/Goal: $1

Exploration Process:
✅ Framed problem and discovered ${ALT_COUNT} alternatives
✅ Explored all alternatives in parallel (${ALT_COUNT}x speedup)
✅ Built prototypes and collected empirical data
✅ Performed multi-criteria evaluation with weighted scoring
✅ Generated evidence-based recommendation
✅ Created implementation roadmap

Deliverables Created:
- Problem analysis and solution space exploration
- ${ALT_COUNT} alternatives with detailed analysis
- Prototypes and empirical test results
- Multi-criteria scoring matrix
- Trade-off and sensitivity analysis
- Evidence-based recommendation
- Scenario-based guidance
- Phased implementation roadmap
- Risk mitigation plan
- Architecture decision record (ADR)

Key Artifacts:
- .orchestr8/docs/research/alternatives/problem-analysis-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/alternatives/ (${ALT_COUNT} files)
- .orchestr8/docs/research/alternatives/explorations/ (${ALT_COUNT} explorations)
- .orchestr8/docs/research/alternatives/evaluation/scoring-matrix-YYYY-MM-DD.md
- .orchestr8/docs/research/alternatives/recommendation-YYYY-MM-DD.md

Winning Alternative: [Extract from recommendation]
Key Evidence: [Extract from scoring matrix]

Next Steps:
1. Review recommendation and implementation roadmap
2. Discuss with stakeholders if major decision
3. Begin Phase 1 of implementation
4. Track success metrics during rollout
5. Update knowledge base with outcomes
"
```

---

## Success Criteria

Exploration is complete when:
- ✅ Problem clearly defined with constraints
- ✅ Diverse alternatives discovered (4-6 explored)
- ✅ Each alternative prototyped and tested
- ✅ Empirical performance data collected
- ✅ Multi-criteria evaluation completed
- ✅ Clear recommendation made with evidence
- ✅ Implementation roadmap defined
- ✅ Risks identified and mitigated
- ✅ Knowledge captured for reuse
- ✅ All quality gates passed

---

## Example Usage

### Example 1: API Design Pattern
```
/orchestr8:explore-alternatives "Best API design for our mobile app backend?"

Alternatives Explored:
1. RESTful with OpenAPI
2. GraphQL with Apollo
3. gRPC with Protocol Buffers
4. tRPC for type-safe APIs
5. REST + GraphQL hybrid

Evaluation:
- Performance, DX, type safety, ecosystem, learning curve

Recommendation: GraphQL with Apollo
- Best DX for mobile (flexible queries)
- Type-safe with codegen
- Reduces over-fetching (40% less data)
- Team already familiar
Trade-off: Slightly more complex than REST
```

### Example 2: State Management
```
/orchestr8:explore-alternatives "State management for complex React dashboard?"

Alternatives:
1. Redux Toolkit
2. Zustand
3. Jotai (atomic)
4. TanStack Query (server state)
5. XState (state machines)
6. Hybrid: Zustand + TanStack Query

Recommendation: Hybrid (Zustand + TanStack)
- Zustand for local state (1KB)
- TanStack Query for server state
- Best performance (minimal re-renders)
- Simple APIs, low boilerplate
```

---

## Anti-Patterns to Avoid

❌ Don't settle for first solution that works
❌ Don't only explore obvious alternatives
❌ Don't skip prototyping (no speculation)
❌ Don't use single-criterion evaluation
❌ Don't ignore implementation complexity
❌ Don't forget operational costs
❌ Don't skip risk assessment

✅ DO generate diverse alternatives (5-10 initially)
✅ DO consider unconventional approaches
✅ DO prototype and test empirically
✅ DO use multi-criteria evaluation
✅ DO weight criteria by business importance
✅ DO perform sensitivity analysis
✅ DO create phased implementation plans

---

## Notes

- Exploration is creative: don't constrain thinking too early
- **Parallel alternative exploration is embarrassingly parallel: maximum speedup**
- Diverse alternatives lead to better final solutions
- Prototyping beats speculation every time
- Multi-criteria evaluation prevents tunnel vision
- Phased implementation reduces risk
- Knowledge capture ensures insights aren't lost

**Remember:** "The best way to have a good idea is to have lots of ideas." Explore widely, then choose wisely based on evidence.
