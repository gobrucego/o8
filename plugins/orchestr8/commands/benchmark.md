---
description: Technology and pattern comparison workflow with empirical performance and feature analysis
argument-hint: [comparison-question]
model: claude-sonnet-4-5
---

# Benchmark Workflow

## ⚠️ CRITICAL: Autonomous Orchestration Required

**DO NOT execute this workflow in the main Claude Code context.**

You MUST immediately delegate this entire workflow to specialized benchmark agents using the Task tool.

**Delegation Instructions:**
```
This benchmark workflow coordinates multiple specialized agents in parallel to compare alternatives systematically.

Primary orchestrator: general-purpose agent
Benchmark specialists used: performance-researcher, code-researcher, language specialists

Execute the benchmark workflow for: [user's comparison question].

Perform systematic technology/pattern comparison:
1. Define benchmark plan and candidates (15%)
2. Execute benchmarks for all candidates in parallel (55%)
3. Perform comparative analysis with scoring (15%)
4. Generate decision support materials (15%)

Follow all phases, champion parallelism, enforce quality gates, and meet success criteria defined below."
```

**After delegation:**
- Benchmark agents work autonomously through testing
- Parallel execution for 3-5x speedup
- Return to main context only when complete or if user input required
- Do NOT attempt to execute workflow steps in main context

---

## Benchmark Workflow Instructions for Orchestrator

Systematic comparison workflow for evaluating technologies, frameworks, patterns, or approaches using empirical benchmarks and structured analysis.

## Intelligence Database Integration

```bash
# Initialize workflow
echo "📊 Starting Benchmark Workflow"
echo "Comparison Question: $1"

# Query similar benchmark patterns from knowledge base
# Check for prior benchmarks on similar technologies
```

---

## Phase 1: Benchmark Definition (0-15%)

**⚡ EXECUTE TASK TOOL:**
```
Use the performance-researcher or code-researcher agent to:
1. Parse comparison question and identify candidates
2. Define comprehensive comparison dimensions
3. Design fair benchmarking methodology
4. Establish baseline requirements
5. Create detailed benchmark plan

subagent_type: "orchestr8:research:performance-researcher"
description: "Define benchmark plan and comparison methodology"
prompt: "Define comprehensive benchmark plan for: $1

Tasks:
1. **Identify Candidates**
   - Parse comparison question
   - List all alternatives to compare (typically 3-5)
   - Validate candidates are comparable (apples-to-apples)
   - Research current versions and maturity levels
   - Document each candidate's key characteristics

2. **Define Comparison Dimensions**
   - Performance metrics (speed, memory, throughput, latency)
   - Feature completeness (required features checklist)
   - Developer experience (API ergonomics, learning curve, tooling)
   - Ecosystem maturity (libraries, community, documentation)
   - Cost analysis (licensing, infrastructure, development time)
   - Security posture (vulnerabilities, update frequency)
   - Maintainability (code clarity, debugging ease)

3. **Design Benchmarks**
   - Create realistic test scenarios (not synthetic/toy examples)
   - Define workload characteristics (read-heavy, write-heavy, mixed)
   - Establish measurement methodology (tools, duration, iterations)
   - Set up fair comparison environment (same hardware, network, etc.)
   - Define statistical rigor (sample size, confidence intervals)

4. **Establish Baseline**
   - Define "acceptable" performance thresholds
   - Set minimum requirements (must-haves)
   - Identify deal-breakers
   - Weight comparison criteria by importance (must sum to 100%)

5. **Create Benchmark Plan**
   - Test scenarios for each candidate
   - Success criteria for each dimension
   - Timeline and resource allocation
   - Risk mitigation for benchmark failures

Expected outputs:
- .orchestr8/docs/performance/benchmarks/benchmark-plan-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/candidates/ - One file per candidate
  * candidate-1-[name].md - Overview and specifications
  * candidate-2-[name].md
  * candidate-3-[name].md
- .orchestr8/docs/performance/benchmarks/test-scenarios-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/evaluation-criteria-YYYY-MM-DD.md

Example Benchmark Plan:
---
# Database Benchmark Plan

## Candidates
1. PostgreSQL 16 (relational, ACID)
2. MongoDB 7 (document store, NoSQL)
3. DynamoDB (managed NoSQL, serverless)

## Test Scenarios
1. Simple CRUD operations (10k records)
2. Complex joins (5 tables, 100k records)
3. Full-text search (1M documents)
4. Concurrent writes (1k writes/sec)
5. Read-heavy workload (10k reads/sec)

## Performance Metrics
- Latency (p50, p95, p99)
- Throughput (operations/sec)
- Resource usage (CPU, memory, disk I/O)
- Scalability (1x, 10x, 100x data volume)

## Environment
- AWS t3.medium instances (consistent hardware)
- Same region and AZ
- Isolated network for fairness
- Clean install with default config (then optimized)
---
"
```

**Expected Outputs:**
- `.orchestr8/docs/performance/benchmarks/benchmark-plan-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/candidates/` - Candidate descriptions
- `.orchestr8/docs/performance/benchmarks/test-scenarios-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/evaluation-criteria-YYYY-MM-DD.md`

**Quality Gate: Benchmark Plan Validation**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

BENCHMARK_PLAN=$(get_orchestr8_path "performance/benchmarks" "benchmark-plan-$(date +%Y-%m-%d).md")

# Validate benchmark plan exists
if [ ! -f "$BENCHMARK_PLAN" ]; then
  echo "❌ Benchmark plan not created"
  exit 1
fi

# Check for candidates directory
CANDIDATES_DIR=$(get_orchestr8_path "performance/benchmarks" "candidates")
if [ ! -d "$CANDIDATES_DIR" ]; then
  echo "❌ Candidates directory not created"
  exit 1
fi

# Count candidates (should be 2-5)
CANDIDATE_COUNT=$(find "$CANDIDATES_DIR" -name "candidate-*.md" | wc -l)
if [ "$CANDIDATE_COUNT" -lt 2 ]; then
  echo "❌ Too few candidates: $CANDIDATE_COUNT (need 2-5)"
  exit 1
fi

if [ "$CANDIDATE_COUNT" -gt 5 ]; then
  echo "⚠️ Warning: Many candidates ($CANDIDATE_COUNT), benchmark may take long time"
fi

echo "✅ Benchmark plan validated with ${CANDIDATE_COUNT} candidates"
```

---

## Phase 2: Parallel Benchmark Execution (15-70%)

**🚀 PARALLEL EXECUTION REQUIRED:** This is critical for benchmark efficiency. Execute all candidate benchmarks IN PARALLEL using multiple Task calls in a SINGLE MESSAGE for maximum speed (3-5x speedup). Each benchmark agent works independently with isolated environment and outputs to separate files (no conflicts).

**For EACH candidate, launch a specialized benchmarker in parallel:**

### Candidate 1 Benchmarking

**⚡ EXECUTE TASK TOOL (in parallel with others):**
```
Select appropriate specialist based on candidate type:
- Database → database specialist (postgres-specialist, mongodb-specialist, etc.)
- Framework → framework specialist (react-specialist, nextjs-specialist, etc.)
- Language → language specialist (python-developer, rust-developer, etc.)
- Cloud → cloud specialist (aws-specialist, gcp-specialist, etc.)
- Performance-focused → performance-researcher

subagent_type: "[orchestr8:research:performance-researcher|orchestr8:database:postgresql-specialist|orchestr8:frontend:react-specialist|orchestr8:languages:rust-developer]"
description: "Benchmark Candidate 1 comprehensively"
prompt: "Benchmark candidate from file: .orchestr8/docs/performance/benchmarks/candidates/candidate-1-*.md

Benchmark plan: .orchestr8/docs/performance/benchmarks/benchmark-plan-*.md
Test scenarios: .orchestr8/docs/performance/benchmarks/test-scenarios-*.md

Tasks:
1. **Environment Setup**
   - Install candidate technology (specific version)
   - Configure for production-like settings
   - Apply best practices for optimization
   - Warm up caches and connections
   - Document all configuration choices

2. **Performance Benchmarking**
   - Run all test scenarios from benchmark plan
   - Measure latency (p50, p95, p99 percentiles)
   - Measure throughput (ops/sec, requests/sec)
   - Monitor resource usage (CPU %, memory MB, disk I/O, network)
   - Test under different loads (1x, 10x, 100x baseline)
   - Stress test to find breaking points
   - Run multiple iterations for statistical validity

3. **Feature Analysis**
   - Test each required feature from evaluation criteria
   - Assess ease of implementation for each feature
   - Document limitations discovered
   - Test edge cases and error handling
   - Evaluate documentation quality for features

4. **Developer Experience Assessment**
   - Measure setup time and complexity
   - Evaluate API ergonomics and clarity
   - Test debugging capabilities and tools
   - Assess error messages quality
   - Review tooling ecosystem (IDE support, linters, etc.)
   - Document learning curve observations

5. **Operational Characteristics**
   - Deployment complexity and time
   - Monitoring capabilities and instrumentation
   - Backup/restore procedures
   - Upgrade path and breaking changes
   - Configuration management approach

6. **Cost Analysis**
   - Infrastructure costs (compute, storage, network)
   - Licensing costs (if applicable)
   - Development time costs (based on complexity)
   - Operational overhead costs

Expected outputs:
- .orchestr8/docs/performance/benchmarks/results-YYYY-MM-DD/candidate-1-[name]/
  * performance-metrics.json - Raw performance data
  * resource-usage.csv - CPU, memory, disk over time
  * feature-test-results.md - Feature completeness assessment
  * dev-experience-notes.md - Qualitative DX evaluation
  * cost-analysis.md - Total cost of ownership
  * benchmark-summary.md - Executive summary

CRITICAL: Use separate output directory for this candidate to avoid conflicts during parallel execution.

Benchmarking Script Pattern:
---
import time
import statistics

def run_benchmark(operation, iterations=1000):
    # Warmup
    for _ in range(100):
        operation()

    # Measure
    latencies = []
    start_time = time.time()

    for _ in range(iterations):
        op_start = time.perf_counter()
        operation()
        latencies.append((time.perf_counter() - op_start) * 1000)

    total_time = time.time() - start_time

    return {
        'p50': statistics.median(latencies),
        'p95': statistics.quantiles(latencies, n=20)[18],
        'p99': statistics.quantiles(latencies, n=100)[98],
        'mean': statistics.mean(latencies),
        'min': min(latencies),
        'max': max(latencies),
        'throughput': iterations / total_time
    }
---
"
```

### Candidate 2 Benchmarking (PARALLEL)
### Candidate 3 Benchmarking (PARALLEL)
### Candidate 4 Benchmarking (PARALLEL - if exists)
### Candidate 5 Benchmarking (PARALLEL - if exists)

**[Repeat same pattern for each candidate with different output paths]**

**⚠️ ORCHESTRATION NOTE:**
```
Launch ALL candidate benchmarks in a SINGLE MESSAGE with multiple Task tool calls.

Example for 3 candidates:
- Single message containing 3 Task tool uses
- Each Task benchmarks one candidate
- All execute simultaneously in isolated environments
- Each writes to separate results directory
- Total time = longest benchmark (not sum of all)

Speed advantage:
- Sequential: 3 candidates × 3 hours = 9 hours
- Parallel: 3 candidates in parallel = 3 hours (3x speedup)
```

**Expected Outputs (for all candidates):**
- `.orchestr8/docs/performance/benchmarks/results-YYYY-MM-DD/candidate-1-[name]/`
  - `performance-metrics.json`
  - `resource-usage.csv`
  - `feature-test-results.md`
  - `dev-experience-notes.md`
  - `cost-analysis.md`
  - `benchmark-summary.md`
- `.orchestr8/docs/performance/benchmarks/results-YYYY-MM-DD/candidate-2-[name]/` (same structure)
- `.orchestr8/docs/performance/benchmarks/results-YYYY-MM-DD/candidate-3-[name]/` (same structure)

**Quality Gate: Benchmark Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

RESULTS_DIR=$(get_orchestr8_path "performance/benchmarks" "results-$(date +%Y-%m-%d)")

# Validate all candidate results exist
RESULTS_COUNT=$(find "$RESULTS_DIR" -type d -name "candidate-*" | wc -l)
if [ "$RESULTS_COUNT" -lt 2 ]; then
  echo "❌ Missing benchmark results: found $RESULTS_COUNT, expected 2+"
  exit 1
fi

# Validate each result has required files
for candidate_dir in "$RESULTS_DIR"/candidate-*; do
  if [ ! -f "$candidate_dir/performance-metrics.json" ]; then
    echo "❌ Missing performance metrics: $candidate_dir"
    exit 1
  fi

  if [ ! -f "$candidate_dir/benchmark-summary.md" ]; then
    echo "❌ Missing benchmark summary: $candidate_dir"
    exit 1
  fi
done

echo "✅ All ${RESULTS_COUNT} candidates benchmarked with comprehensive data"
```

---

## Phase 3: Comparative Analysis (70-85%)

**⚡ EXECUTE TASK TOOL:**
```
Use the performance-researcher agent to:
1. Aggregate and normalize benchmark data
2. Create comprehensive comparison visualizations
3. Build feature comparison matrix
4. Perform trade-off analysis across dimensions
5. Calculate weighted scores with sensitivity analysis
6. Identify best-fit scenarios for each candidate

subagent_type: "orchestr8:research:performance-researcher"
description: "Analyze benchmark results and compare candidates"
prompt: "Perform comprehensive comparative analysis of benchmark results:

Input files:
- .orchestr8/docs/performance/benchmarks/results-*/candidate-*/
- .orchestr8/docs/performance/benchmarks/evaluation-criteria-*.md

Tasks:
1. **Data Validation**
   - Verify all benchmarks ran correctly
   - Check for outliers or anomalies (explain if found)
   - Validate statistical significance of differences
   - Ensure fair comparison (same conditions verified)

2. **Performance Comparison**
   - Create performance comparison tables and charts
   - Calculate relative speedups/slowdowns between candidates
   - Identify performance leaders per test scenario
   - Analyze resource efficiency (performance per unit resource)
   - Compare scalability characteristics

3. **Feature Matrix**
   - Build comprehensive feature comparison table
   - Identify unique capabilities of each candidate
   - Highlight gaps and limitations
   - Score feature completeness (0-10 scale)
   - Note feature quality vs just presence

4. **Trade-off Analysis**
   - Performance vs complexity trade-offs
   - Features vs learning curve
   - Cost vs capabilities
   - Flexibility vs simplicity
   - Identify no-free-lunch scenarios

5. **Weighted Scoring**
   - Score each candidate across all dimensions (0-10)
   - Apply criterion weights from evaluation framework
   - Calculate overall weighted scores
   - Rank candidates by total score
   - Identify score differences (significant vs marginal)

6. **Sensitivity Analysis**
   - How do rankings change with different weights?
   - Which candidates are robust vs sensitive to criteria?
   - Identify decision boundaries (when to choose X vs Y)

7. **Scenario-Based Recommendations**
   - Best for performance-critical applications
   - Best for cost-constrained environments
   - Best for developer productivity
   - Best for specific use cases
   - Best for different team sizes/skills

Expected outputs:
- .orchestr8/docs/performance/benchmarks/analysis/performance-comparison-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/analysis/feature-matrix-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/analysis/trade-offs-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/analysis/weighted-scores-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/analysis/sensitivity-analysis-YYYY-MM-DD.md

Comparison Table Format:
| Scenario | Candidate 1 | Candidate 2 | Candidate 3 | Winner |
|----------|-------------|-------------|-------------|--------|
| Simple CRUD (p95) | 2.1ms | 1.8ms | 3.2ms | Candidate 2 |
| Complex Joins | 45ms | N/A | N/A | Candidate 1 |
| Throughput | 8.5k/s | 12k/s | 25k/s | Candidate 3 |

Weighted Scoring Format:
| Criterion | Weight | Cand1 | Cand2 | Cand3 |
|-----------|--------|-------|-------|-------|
| Performance | 35% | 7.2 | 8.1 | 8.8 |
| Features | 30% | 8.4 | 8.0 | 7.4 |
| Dev Experience | 20% | 8.6 | 8.0 | 6.6 |
| Cost | 15% | 9.0 | 7.5 | 6.0 |
| **Total** | | **8.1** | **7.9** | **7.6** |
"
```

**Expected Outputs:**
- `.orchestr8/docs/performance/benchmarks/analysis/performance-comparison-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/analysis/feature-matrix-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/analysis/trade-offs-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/analysis/weighted-scores-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/analysis/sensitivity-analysis-YYYY-MM-DD.md`

**Quality Gate: Analysis Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

ANALYSIS_DIR=$(get_orchestr8_path "performance/benchmarks" "analysis")
WEIGHTED_SCORES=$(find "$ANALYSIS_DIR" -name "weighted-scores-*.md" | head -1)

# Validate analysis files exist
if [ ! -f "$WEIGHTED_SCORES" ]; then
  echo "❌ Weighted scores analysis not created"
  exit 1
fi

# Check for scoring table
if ! grep -q "Weight.*Total" "$WEIGHTED_SCORES"; then
  echo "❌ Missing scoring table in weighted scores"
  exit 1
fi

# Check for winner identification
if ! grep -qE "Winner|Recommendation|Best" "$WEIGHTED_SCORES"; then
  echo "⚠️ Warning: No clear winner identified"
fi

echo "✅ Comparative analysis complete with weighted scoring"
```

---

## Phase 4: Reporting & Decision Support (85-100%)

**⚡ EXECUTE TASK TOOL:**
```
Use the general-purpose agent to:
1. Create executive summary with clear recommendation
2. Write technical deep dive report
3. Build decision matrix for different scenarios
4. Create implementation/migration guide for winner
5. Document benchmark reproducibility
6. Prepare stakeholder presentation

subagent_type: "general-purpose"
description: "Generate decision support materials and reports"
prompt: "Create comprehensive reporting and decision support materials:

Input files:
- .orchestr8/docs/performance/benchmarks/analysis/weighted-scores-*.md
- .orchestr8/docs/performance/benchmarks/analysis/performance-comparison-*.md
- All candidate benchmark results

Tasks:
1. **Executive Summary (1 page)**
   - Clear winner(s) identified with evidence
   - Key differentiators highlighted
   - Top 3 reasons for recommendation
   - Risk assessment summary
   - Cost-benefit summary
   - Implementation timeline estimate

2. **Technical Deep Dive**
   - Complete benchmark methodology
   - Detailed results for each candidate
   - Statistical analysis and confidence intervals
   - Reproducibility instructions
   - Raw data appendix

3. **Decision Matrix**
   - When to use each candidate (scenario-based)
   - Best-fit use cases for each
   - Migration considerations (if replacing existing)
   - Risk assessment for each choice
   - Total cost of ownership comparison

4. **Implementation Guide**
   - Getting started with recommended candidate
   - Best practices and patterns
   - Common pitfalls to avoid
   - Performance tuning tips
   - Resource recommendations (docs, tutorials, communities)

5. **Benchmark Reproducibility**
   - Exact versions used
   - Configuration files
   - Test scripts and commands
   - Environment specifications
   - Instructions to reproduce results

6. **Knowledge Capture**
   - Store in .orchestr8/docs/knowledge/
   - Technology comparison decision record
   - Performance baselines established
   - Lessons learned

Expected outputs:
- .orchestr8/docs/performance/benchmarks/executive-summary-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/technical-report-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/decision-matrix-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/getting-started-[winner]-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/reproducibility-YYYY-MM-DD.md
- .orchestr8/docs/knowledge/benchmark-[topic]-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/performance/benchmarks/executive-summary-YYYY-MM-DD.md` - 1-page summary
- `.orchestr8/docs/performance/benchmarks/technical-report-YYYY-MM-DD.md` - Full findings
- `.orchestr8/docs/performance/benchmarks/decision-matrix-YYYY-MM-DD.md` - Scenario guide
- `.orchestr8/docs/performance/benchmarks/getting-started-[winner]-YYYY-MM-DD.md`
- `.orchestr8/docs/performance/benchmarks/reproducibility-YYYY-MM-DD.md`
- `.orchestr8/docs/knowledge/benchmark-*.md` - Knowledge base entry

**Quality Gate: Reporting Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

BENCHMARK_DIR=$(get_orchestr8_path "performance/benchmarks")
EXEC_SUMMARY=$(find "$BENCHMARK_DIR" -name "executive-summary-*.md" | head -1)
TECH_REPORT=$(find "$BENCHMARK_DIR" -name "technical-report-*.md" | head -1)

# Validate executive summary exists
if [ ! -f "$EXEC_SUMMARY" ]; then
  echo "❌ Executive summary not created"
  exit 1
fi

# Validate technical report exists
if [ ! -f "$TECH_REPORT" ]; then
  echo "❌ Technical report not created"
  exit 1
fi

# Check for clear recommendation
if ! grep -qE "recommend|winner|best choice" "$EXEC_SUMMARY"; then
  echo "⚠️ Warning: No clear recommendation in executive summary"
fi

# Check decision matrix
DECISION_MATRIX=$(find "$BENCHMARK_DIR" -name "decision-matrix-*.md" | head -1)
if [ ! -f "$DECISION_MATRIX" ]; then
  echo "⚠️ Warning: Decision matrix not created"
fi

echo "✅ Benchmark reporting complete with decision support materials"
```

---

## Workflow Completion

```bash
# Calculate total time
WORKFLOW_END=$(date +%s)

echo "
✅ BENCHMARK WORKFLOW COMPLETE

Comparison Question: $1

Benchmark Process:
✅ Defined comprehensive benchmark plan with ${CANDIDATE_COUNT} candidates
✅ Executed all benchmarks in parallel (${CANDIDATE_COUNT}x speedup)
✅ Collected empirical performance data (latency, throughput, resources)
✅ Performed comparative analysis with weighted scoring
✅ Generated evidence-based recommendation
✅ Created decision support materials

Deliverables Created:
- Benchmark plan with test scenarios
- Complete benchmark results for each candidate
- Performance comparison and feature matrix
- Weighted scoring with sensitivity analysis
- Evidence-based recommendation
- Executive summary for stakeholders
- Technical deep dive report
- Implementation guide for winner
- Reproducibility documentation

Key Artifacts:
- .orchestr8/docs/performance/benchmarks/benchmark-plan-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/candidates/ (${CANDIDATE_COUNT} files)
- .orchestr8/docs/performance/benchmarks/results-YYYY-MM-DD/ (${CANDIDATE_COUNT} results)
- .orchestr8/docs/performance/benchmarks/analysis/weighted-scores-YYYY-MM-DD.md
- .orchestr8/docs/performance/benchmarks/executive-summary-YYYY-MM-DD.md

Winning Candidate: [Extract from recommendation]
Key Metrics: [Extract from comparison]

Next Steps:
1. Review executive summary and recommendation
2. Discuss with stakeholders if major technology decision
3. Follow implementation guide for winner
4. Consider phased migration if replacing existing tech
5. Track success metrics post-implementation
"
```

---

## Success Criteria

Benchmark is complete when:
- ✅ Comparison question clearly defined
- ✅ 2-5 candidates identified and validated
- ✅ All candidates tested under identical conditions
- ✅ Performance metrics collected systematically
- ✅ Feature completeness assessed objectively
- ✅ Developer experience documented
- ✅ Cost analysis completed (TCO)
- ✅ Statistical significance validated
- ✅ Clear recommendation made with evidence
- ✅ Trade-offs acknowledged honestly
- ✅ Results reproducible (methodology documented)
- ✅ Decision support materials prepared
- ✅ All quality gates passed

---

## Example Usage

### Example 1: Database Comparison
```
/orchestr8:benchmark "Compare PostgreSQL, MongoDB, and DynamoDB for our e-commerce platform"

Candidates Benchmarked:
- PostgreSQL 16 (relational)
- MongoDB 7 (document)
- DynamoDB (managed NoSQL)

Benchmarks Run:
- CRUD operations (10k records)
- Complex queries (joins, aggregations)
- Full-text search (1M documents)
- Concurrent writes (1k/sec)
- Read-heavy workload (10k/sec)
- Cost analysis at scale

Results:
- PostgreSQL: Best for complex queries, ACID, cost-effective
- MongoDB: Fast document operations, flexible schema
- DynamoDB: Best scalability, serverless, highest cost

Recommendation: PostgreSQL
Rationale: Best query flexibility, ACID guarantees, 40% lower cost than DynamoDB
Evidence: Handles required queries 3x faster than MongoDB, $800/mo vs $1400/mo
```

### Example 2: Framework Comparison
```
/orchestr8:benchmark "Should we use Next.js, Remix, or SvelteKit for our dashboard?"

Candidates Benchmarked:
- Next.js 14 with App Router
- Remix 2
- SvelteKit 2

Benchmarks Run:
- Build time and bundle size
- Initial page load (Lighthouse)
- Time to Interactive (TTI)
- Client-side navigation speed
- Data fetching performance
- Developer productivity (measured)

Results:
- Next.js: Largest ecosystem, larger bundle
- Remix: Best data loading patterns
- SvelteKit: Smallest bundle, fastest builds

Recommendation: Next.js
Rationale: Mature ecosystem, team familiarity, best documentation
Trade-off: 15% larger bundle acceptable for better DX and ecosystem
```

---

## Anti-Patterns to Avoid

❌ Don't cherry-pick favorable benchmarks
❌ Don't use toy/synthetic workloads
❌ Don't compare different versions or configs
❌ Don't ignore developer experience factors
❌ Don't forget to measure resource usage
❌ Don't skip cost analysis
❌ Don't make recommendations without empirical data
❌ Don't trust benchmarks from vendors (run your own)

✅ DO test 2-5 candidates for meaningful comparison
✅ DO use realistic workloads reflecting actual use
✅ DO run benchmarks multiple times for statistical validity
✅ DO test under production-like conditions
✅ DO document methodology for reproducibility
✅ DO consider qualitative and quantitative factors
✅ DO weight criteria by business importance
✅ DO acknowledge trade-offs honestly

---

## Notes

- Benchmarks are time-boxed: typically 3-6 hours for complete workflow
- **Parallel candidate testing is the key speedup: 3-5x faster than sequential**
- Focus on realistic workloads: synthetic benchmarks can be misleading
- Document all assumptions and constraints
- Consider total cost of ownership, not just performance
- Remember: "The best tool is the one your team knows well"
- Results are a snapshot: re-benchmark as technologies evolve
- Statistical rigor is important: run multiple iterations, calculate confidence intervals

**Remember:** Benchmarks inform decisions but don't make them. Consider team expertise, ecosystem maturity, and long-term maintainability alongside raw performance numbers.
