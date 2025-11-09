---
description: Parallel hypothesis testing workflow for exploring multiple approaches simultaneously
argument-hint: [research-question-or-problem]
model: claude-sonnet-4-5
---

# Research Workflow

## ⚠️ CRITICAL: Autonomous Orchestration Required

**DO NOT execute this workflow in the main Claude Code context.**

You MUST immediately delegate this entire workflow to specialized research agents using the Task tool.

**Delegation Instructions:**
```
This research workflow coordinates multiple specialized agents in parallel to explore hypotheses systematically.

Primary orchestrator: general-purpose agent
Research specialists used: code-researcher, pattern-experimenter, assumption-validator, performance-researcher

Execute the research workflow for: [user's research question].

Perform parallel hypothesis testing and multi-approach exploration:
1. Formulate 3-5 testable hypotheses (15%)
2. Test all hypotheses in parallel using specialized agents (55%)
3. Perform comparative analysis of results (15%)
4. Generate evidence-based recommendation (15%)

Follow all phases, champion parallelism, enforce quality gates, and meet success criteria defined below."
```

**After delegation:**
- Research agents work autonomously through hypothesis testing
- Parallel execution for 3-5x speedup
- Return to main context only when complete or if user input required
- Do NOT attempt to execute workflow steps in main context

---

## Research Workflow Instructions for Orchestrator

Autonomous workflow for parallel hypothesis testing and multi-approach exploration with evidence-based decision making.

## Intelligence Database Integration

```bash
# Initialize workflow
echo "🔬 Starting Research Workflow"
echo "Research Question: $1"

# Query similar research patterns from knowledge base
# Check for prior research on similar questions
```

---

## Phase 1: Hypothesis Formulation (0-15%)

**⚡ EXECUTE TASK TOOL:**
```
Use the code-researcher or architect agent to:
1. Analyze research question deeply
2. Generate 3-5 testable hypotheses or alternative approaches
3. Define success criteria for each hypothesis
4. Establish evaluation methodology
5. Design experiments to test each hypothesis

subagent_type: "orchestr8:research:code-researcher"
description: "Formulate testable hypotheses for research question"
prompt: "Formulate hypotheses for research question: $1

Tasks:
1. **Problem Analysis**
   - Parse research question or problem statement
   - Identify constraints and requirements
   - Define scope and boundaries
   - Establish success metrics
   - Identify what decisions depend on this research

2. **Hypothesis Generation**
   - Brainstorm 3-5 alternative approaches or hypotheses
   - For each hypothesis, define:
     * Core assumption or claim
     * Expected benefits
     * Potential drawbacks
     * Success criteria (measurable)
     * Validation method (how to test)
     * Resource requirements

3. **Experiment Design**
   - Define test scenarios for each hypothesis
   - Identify required resources (tools, data, time)
   - Establish measurement methodology
   - Create evaluation criteria (performance, complexity, cost, etc.)
   - Design data collection strategy
   - Weight evaluation criteria by importance

4. **Research Plan**
   - Prioritize hypotheses by potential impact
   - Identify which can be tested in parallel
   - Estimate time for each hypothesis test
   - Plan for iteration if results inconclusive

Expected outputs:
- .orchestr8/docs/research/research-plan-YYYY-MM-DD.md - Overall research plan
- .orchestr8/docs/research/hypotheses/ - Directory with one file per hypothesis
  * hypothesis-1-[name].md
  * hypothesis-2-[name].md
  * hypothesis-3-[name].md
- .orchestr8/docs/research/evaluation-criteria-YYYY-MM-DD.md - Scoring methodology

Example Hypothesis Structure:
---
# Hypothesis 1: [Name]

**Claim:** [What we believe to be true]

**Assumptions:**
- [Key assumption 1]
- [Key assumption 2]

**Success Criteria:**
- [Measurable criterion 1]
- [Measurable criterion 2]

**Validation Method:**
- [How to test this hypothesis]

**Expected Impact:** [High/Medium/Low]
**Risk if Wrong:** [Description]
---
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/research-plan-YYYY-MM-DD.md` - Complete research plan
- `.orchestr8/docs/research/hypotheses/` - Individual hypothesis files
- `.orchestr8/docs/research/evaluation-criteria-YYYY-MM-DD.md` - Success metrics

**Quality Gate: Hypothesis Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

RESEARCH_PLAN=$(get_orchestr8_path "research" "research-plan-$(date +%Y-%m-%d).md")

# Validate research plan exists
if [ ! -f "$RESEARCH_PLAN" ]; then
  echo "❌ Research plan not created"
  exit 1
fi

# Check for hypotheses directory
HYPOTHESES_DIR=$(get_orchestr8_path "research" "hypotheses")
if [ ! -d "$HYPOTHESES_DIR" ]; then
  echo "❌ Hypotheses directory not created"
  exit 1
fi

# Count hypotheses (should be 3-5)
HYPOTHESIS_COUNT=$(find "$HYPOTHESES_DIR" -name "hypothesis-*.md" | wc -l)
if [ "$HYPOTHESIS_COUNT" -lt 3 ]; then
  echo "❌ Too few hypotheses: $HYPOTHESIS_COUNT (need 3-5)"
  exit 1
fi

echo "✅ ${HYPOTHESIS_COUNT} hypotheses formulated and validated"
```

---

## Phase 2: Parallel Hypothesis Testing (15-70%)

**🚀 PARALLEL EXECUTION REQUIRED:** This is the core value of research workflows. Execute all hypothesis tests IN PARALLEL using multiple Task calls in a SINGLE MESSAGE for maximum speed (3-5x speedup). Each hypothesis test agent works independently and outputs to separate files (no conflicts).

**For EACH hypothesis, launch a specialized agent in parallel:**

### Hypothesis 1 Testing

**⚡ EXECUTE TASK TOOL (in parallel with others):**
```
Select appropriate specialist based on hypothesis type:
- Architecture hypothesis → architect agent
- Performance hypothesis → performance-researcher agent
- Algorithm hypothesis → language specialist
- Technology comparison → code-researcher agent
- Pattern comparison → pattern-experimenter agent

subagent_type: "[orchestr8:research:code-researcher|orchestr8:research:performance-researcher|orchestr8:research:pattern-experimenter|orchestr8:development:architect]"
description: "Test Hypothesis 1 with prototype and empirical data"
prompt: "Test hypothesis from file: .orchestr8/docs/research/hypotheses/hypothesis-1-*.md

Tasks:
1. **Prototype Implementation**
   - Create minimal viable proof-of-concept
   - Focus on testable aspects defined in hypothesis
   - Implement just enough to gather evidence
   - Document assumptions made during implementation

2. **Empirical Testing**
   - Run defined test scenarios
   - Measure performance metrics (latency, throughput, resource usage)
   - Collect quantitative data
   - Test edge cases and failure modes
   - Stress test to find breaking points

3. **Data Collection**
   - Performance benchmarks (p50, p95, p99 if applicable)
   - Code complexity metrics (LOC, cyclomatic complexity)
   - Resource utilization (CPU, memory, disk)
   - Developer experience observations
   - Scalability testing results
   - Cost analysis (infrastructure, development time)

4. **Evidence Gathering**
   - Pros discovered (what worked well)
   - Cons discovered (what didn't work)
   - Unexpected findings
   - Edge cases or limitations found
   - Comparison to baseline (if exists)

5. **Documentation**
   - Implementation notes and code samples
   - Test results with raw data
   - Performance graphs/charts
   - Qualitative observations
   - Recommendation: pass/fail on success criteria

Expected outputs:
- .orchestr8/docs/research/results/hypothesis-1-results-YYYY-MM-DD.md
- .orchestr8/docs/research/poc/hypothesis-1/ (optional prototype code)
- .orchestr8/docs/research/benchmarks/hypothesis-1-metrics.json (raw data)

CRITICAL: Output files must be separate from other hypothesis tests to avoid conflicts during parallel execution.
"
```

### Hypothesis 2 Testing (PARALLEL)
### Hypothesis 3 Testing (PARALLEL)
### Hypothesis 4 Testing (PARALLEL - if exists)
### Hypothesis 5 Testing (PARALLEL - if exists)

**[Repeat same pattern for each hypothesis with different output paths]**

**⚠️ ORCHESTRATION NOTE:**
```
Launch ALL hypothesis tests in a SINGLE MESSAGE with multiple Task tool calls.

Example for 4 hypotheses:
- Single message containing 4 Task tool uses
- Each Task tests one hypothesis
- All execute simultaneously
- Each writes to separate output directory
- Total time = longest hypothesis test (not sum of all)

Speed advantage:
- Sequential: 4 hypotheses × 2 hours = 8 hours
- Parallel: 4 hypotheses in parallel = 2 hours (4x speedup)
```

**Expected Outputs (for all hypotheses):**
- `.orchestr8/docs/research/results/hypothesis-1-results-YYYY-MM-DD.md`
- `.orchestr8/docs/research/results/hypothesis-2-results-YYYY-MM-DD.md`
- `.orchestr8/docs/research/results/hypothesis-3-results-YYYY-MM-DD.md`
- `.orchestr8/docs/research/poc/hypothesis-*/` - Prototype code (optional)
- `.orchestr8/docs/research/benchmarks/` - Performance data

**Quality Gate: Testing Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

RESULTS_DIR=$(get_orchestr8_path "research" "results")

# Validate all hypothesis results exist
RESULTS_COUNT=$(find "$RESULTS_DIR" -name "hypothesis-*-results-*.md" | wc -l)
if [ "$RESULTS_COUNT" -lt 3 ]; then
  echo "❌ Missing hypothesis test results: found $RESULTS_COUNT, expected 3+"
  exit 1
fi

# Validate each result has data
for result_file in "$RESULTS_DIR"/hypothesis-*-results-*.md; do
  if [ ! -s "$result_file" ]; then
    echo "❌ Empty result file: $result_file"
    exit 1
  fi

  # Check for required sections
  if ! grep -q "Performance\|Evidence\|Data" "$result_file"; then
    echo "⚠️ Warning: $result_file may be incomplete (missing data sections)"
  fi
done

echo "✅ All ${RESULTS_COUNT} hypotheses tested with empirical evidence"
```

---

## Phase 3: Comparative Analysis (70-85%)

**⚡ EXECUTE TASK TOOL:**
```
Use the code-researcher agent to:
1. Aggregate results from all hypothesis tests
2. Normalize metrics for fair comparison
3. Create comparison matrix with weighted scoring
4. Identify Pareto-optimal solutions
5. Perform risk assessment for each approach
6. Conduct cost-benefit analysis

subagent_type: "orchestr8:research:code-researcher"
description: "Synthesize research findings and compare hypotheses"
prompt: "Perform comparative analysis of all hypothesis test results:

Input files:
- .orchestr8/docs/research/results/hypothesis-*-results-*.md
- .orchestr8/docs/research/evaluation-criteria-*.md

Tasks:
1. **Data Synthesis**
   - Aggregate results from all hypotheses
   - Normalize metrics for comparison (e.g., convert all to 0-10 scale)
   - Identify patterns and outliers
   - Validate data quality and completeness

2. **Comparative Evaluation**
   - Score each hypothesis against all criteria
   - Apply criterion weights from evaluation framework
   - Calculate overall weighted scores
   - Create comparison matrix (table format)
   - Identify clear winners and losers

3. **Trade-off Analysis**
   - Performance vs complexity trade-offs
   - Cost vs benefit trade-offs
   - Short-term vs long-term considerations
   - Risk vs reward analysis

4. **Pareto Analysis**
   - Identify Pareto-optimal solutions (not dominated by any other)
   - Identify dominated solutions (strictly worse than another)
   - Explain why certain solutions are/aren't optimal

5. **Risk Assessment**
   - Implementation risks for each hypothesis
   - Technical debt implications
   - Team capability requirements
   - Long-term maintainability concerns

6. **Sensitivity Analysis**
   - How do rankings change with different criterion weights?
   - Which hypotheses are robust vs sensitive to assumptions?
   - Identify decision boundaries

Expected outputs:
- .orchestr8/docs/research/analysis/comparative-analysis-YYYY-MM-DD.md
- .orchestr8/docs/research/analysis/comparison-matrix-YYYY-MM-DD.md (scoring table)
- .orchestr8/docs/research/analysis/trade-offs-YYYY-MM-DD.md
- .orchestr8/docs/research/analysis/pareto-frontier-YYYY-MM-DD.md

Comparison Matrix Format:
| Criterion | Weight | Hyp1 | Hyp2 | Hyp3 | Winner |
|-----------|--------|------|------|------|--------|
| Performance | 30% | 8/10 | 9/10 | 7/10 | Hyp2 |
| Complexity | 20% | 6/10 | 4/10 | 9/10 | Hyp3 |
| Cost | 15% | 9/10 | 7/10 | 8/10 | Hyp1 |
| **Weighted Total** | | 7.7 | 7.2 | 7.8 | Hyp3 |
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/analysis/comparative-analysis-YYYY-MM-DD.md`
- `.orchestr8/docs/research/analysis/comparison-matrix-YYYY-MM-DD.md`
- `.orchestr8/docs/research/analysis/trade-offs-YYYY-MM-DD.md`
- `.orchestr8/docs/research/analysis/pareto-frontier-YYYY-MM-DD.md`

**Quality Gate: Analysis Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

ANALYSIS_DIR=$(get_orchestr8_path "research" "analysis")
COMPARISON_MATRIX=$(find "$ANALYSIS_DIR" -name "comparison-matrix-*.md" | head -1)

# Validate analysis files exist
if [ ! -f "$COMPARISON_MATRIX" ]; then
  echo "❌ Comparison matrix not created"
  exit 1
fi

# Check for scoring table
if ! grep -q "Weight.*Hyp" "$COMPARISON_MATRIX"; then
  echo "❌ Comparison matrix missing scoring table"
  exit 1
fi

# Check for winner identification
if ! grep -qE "Winner|Recommendation|Best" "$COMPARISON_MATRIX"; then
  echo "⚠️ Warning: No clear winner identified"
fi

echo "✅ Comparative analysis complete with scoring matrix"
```

---

## Phase 4: Recommendation & Knowledge Capture (85-100%)

**⚡ EXECUTE TASK TOOL:**
```
Use the general-purpose agent to:
1. Formulate evidence-based recommendation
2. Identify scenarios where each approach works best
3. Create implementation roadmap for winning approach
4. Document decision rationale (ADR format)
5. Capture learnings in knowledge base
6. Generate stakeholder presentation

subagent_type: "general-purpose"
description: "Generate research recommendation and capture knowledge"
prompt: "Create final recommendation and knowledge artifacts:

Input files:
- .orchestr8/docs/research/analysis/comparison-matrix-*.md
- .orchestr8/docs/research/results/hypothesis-*-results-*.md

Tasks:
1. **Primary Recommendation**
   - Identify top-ranked hypothesis/approach
   - Justify selection with empirical evidence
   - Reference specific metrics and test results
   - Acknowledge limitations and trade-offs
   - Define success metrics for rollout

2. **Scenario-Based Guidance**
   - "If performance is critical..." → Hypothesis X
   - "If budget is constrained..." → Hypothesis Y
   - "If time is limited..." → Hypothesis Z
   - Conditions that would change recommendation
   - Hybrid approaches to consider

3. **Implementation Roadmap**
   - Phase 1: Quick wins or foundational work
   - Phase 2: Core implementation
   - Phase 3: Advanced optimizations (if needed)
   - Timeline estimates
   - Resource requirements
   - Risk mitigation strategies

4. **Architecture Decision Record (ADR)**
   - Title: Research decision
   - Context: Why we did this research
   - Options considered: All hypotheses
   - Decision: Which approach chosen
   - Consequences: Expected outcomes
   - Date and participants

5. **Knowledge Capture**
   - Store findings in .orchestr8/docs/knowledge/
   - Document what worked and what didn't
   - Capture reusable patterns discovered
   - Record performance baselines
   - Create searchable decision record

6. **Stakeholder Materials**
   - Executive summary (1 page)
   - Detailed findings report
   - Presentation slides/outline
   - Technical deep-dive documentation

Expected outputs:
- .orchestr8/docs/research/recommendation-YYYY-MM-DD.md
- .orchestr8/docs/research/executive-summary-YYYY-MM-DD.md
- .orchestr8/docs/research/implementation-roadmap-YYYY-MM-DD.md
- .orchestr8/docs/knowledge/research-decision-[topic]-YYYY-MM-DD.md (ADR)
- .orchestr8/docs/research/presentation-outline-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/recommendation-YYYY-MM-DD.md` - Final recommendation with evidence
- `.orchestr8/docs/research/executive-summary-YYYY-MM-DD.md` - 1-page summary
- `.orchestr8/docs/research/implementation-roadmap-YYYY-MM-DD.md` - Next steps
- `.orchestr8/docs/knowledge/research-decision-*.md` - ADR for knowledge base
- `.orchestr8/docs/research/presentation-outline-YYYY-MM-DD.md` - Stakeholder materials

**Quality Gate: Recommendation Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

RESEARCH_DIR=$(get_orchestr8_path "research")
RECOMMENDATION=$(find "$RESEARCH_DIR" -name "recommendation-*.md" | head -1)
EXEC_SUMMARY=$(find "$RESEARCH_DIR" -name "executive-summary-*.md" | head -1)

# Validate recommendation exists
if [ ! -f "$RECOMMENDATION" ]; then
  echo "❌ Recommendation not created"
  exit 1
fi

# Validate executive summary exists
if [ ! -f "$EXEC_SUMMARY" ]; then
  echo "❌ Executive summary not created"
  exit 1
fi

# Check recommendation has evidence
if ! grep -qE "evidence|data|metrics|benchmark" "$RECOMMENDATION"; then
  echo "⚠️ Warning: Recommendation may lack empirical evidence"
fi

# Check for implementation roadmap
ROADMAP=$(find "$RESEARCH_DIR" -name "implementation-roadmap-*.md" | head -1)
if [ ! -f "$ROADMAP" ]; then
  echo "⚠️ Warning: Implementation roadmap not created"
fi

echo "✅ Research recommendation complete with evidence and roadmap"
```

---

## Workflow Completion

```bash
# Calculate total time
WORKFLOW_END=$(date +%s)

echo "
✅ RESEARCH WORKFLOW COMPLETE

Research Question: $1

Research Process:
✅ Formulated ${HYPOTHESIS_COUNT} testable hypotheses
✅ Tested all hypotheses in parallel (${HYPOTHESIS_COUNT}x speedup)
✅ Collected empirical evidence (benchmarks, metrics, observations)
✅ Performed comparative analysis with weighted scoring
✅ Generated evidence-based recommendation
✅ Captured knowledge for future reuse

Deliverables Created:
- Research plan and hypotheses
- Test results for each hypothesis
- Comparative analysis and scoring matrix
- Evidence-based recommendation
- Implementation roadmap
- Executive summary for stakeholders
- Architecture decision record (ADR)

Key Artifacts:
- .orchestr8/docs/research/research-plan-YYYY-MM-DD.md
- .orchestr8/docs/research/hypotheses/ (${HYPOTHESIS_COUNT} files)
- .orchestr8/docs/research/results/ (${HYPOTHESIS_COUNT} results)
- .orchestr8/docs/research/analysis/comparison-matrix-YYYY-MM-DD.md
- .orchestr8/docs/research/recommendation-YYYY-MM-DD.md
- .orchestr8/docs/research/executive-summary-YYYY-MM-DD.md

Winning Approach: [Extract from recommendation]
Key Evidence: [Extract from comparison matrix]

Next Steps:
1. Review executive summary and recommendation
2. Discuss with stakeholders if major decision
3. Follow implementation roadmap
4. Track success metrics post-implementation
5. Update knowledge base with outcomes
"
```

---

## Success Criteria

Research is complete when:
- ✅ Research question clearly defined
- ✅ 3-5 testable hypotheses formulated
- ✅ All hypotheses tested with empirical evidence
- ✅ Quantitative metrics collected for each approach
- ✅ Qualitative observations documented
- ✅ Comparative analysis completed objectively
- ✅ Clear recommendation made with justification
- ✅ Trade-offs and risks acknowledged
- ✅ Implementation roadmap defined
- ✅ Knowledge captured in reusable format
- ✅ Stakeholder materials prepared
- ✅ All quality gates passed

---

## Example Usage

### Example 1: Architecture Decision
```
/orchestr8:research "Should we use microservices, modular monolith, or serverless for our e-commerce platform?"

Hypotheses Generated:
1. Microservices with Kubernetes
2. Modular monolith with domain modules
3. Serverless with AWS Lambda
4. Hybrid: Monolith + selective microservices

Tests Each Approach:
- Prototype implementation (minimal but realistic)
- Load testing (10k concurrent users)
- Deployment complexity measurement
- Development velocity assessment
- Cost analysis at scale

Recommendation: Modular monolith with migration path
Rationale: Lower complexity, faster development, easier to start, can extract services later
Evidence: Scored 7.8/10 vs 6.8 (microservices) and 7.2 (serverless)
```

### Example 2: Performance Optimization
```
/orchestr8:research "What's the best approach to reduce our API latency from 500ms to <100ms?"

Hypotheses Generated:
1. Database query optimization + indexing
2. Redis caching layer
3. Read replicas + query routing
4. Materialized views
5. Hybrid: #1 + #2

Tests Each Approach:
- Implementation with realistic data
- Performance benchmarks (p50, p95, p99)
- Resource utilization measurement
- Cost analysis
- Complexity assessment

Recommendation: Phased approach (#1 then #2)
Rationale: Query optimization is free and foundational, caching adds 80% more improvement
Evidence: #1 reduces to 200ms (60% gain), #2 additional reduces to 40ms (92% total)
```

---

## Anti-Patterns to Avoid

❌ Don't start with predetermined conclusion
❌ Don't test only one approach
❌ Don't use subjective criteria without data
❌ Don't skip empirical testing (no speculation)
❌ Don't ignore negative findings
❌ Don't forget risk assessment
❌ Don't make recommendations without evidence
❌ Don't oversimplify complex trade-offs

✅ DO formulate multiple testable hypotheses
✅ DO test all hypotheses in parallel for speed
✅ DO collect both quantitative and qualitative data
✅ DO use empirical evidence over opinions
✅ DO acknowledge limitations and trade-offs
✅ DO capture knowledge for future reuse
✅ DO create implementation roadmap
✅ DO prepare stakeholder materials

---

## Notes

- Research is time-boxed: typically 2-4 hours for complete workflow
- **Parallel hypothesis testing is embarrassingly parallel: maximum speedup opportunity**
- Focus on evidence over opinion - let data guide decisions
- Prototypes can be minimal: just enough to test hypothesis
- Not all hypotheses need code: some can be analyzed theoretically
- Results inform Architect Decision Records (ADRs)
- Knowledge capture ensures findings are reusable across projects
- Fire-and-forget execution allows long-running research without blocking

**Remember:** The goal is not to be right, but to find the truth through systematic exploration and evidence-based decision making.
