---
description: Systematic validation of technical assumptions and constraints through empirical testing
argument-hint: [assumptions-to-validate]
model: claude-sonnet-4-5
---

# Validate Assumptions Workflow

## ⚠️ CRITICAL: Autonomous Orchestration Required

**DO NOT execute this workflow in the main Claude Code context.**

You MUST immediately delegate this entire workflow to specialized validation agents using the Task tool.

**Delegation Instructions:**
```
This validation workflow coordinates multiple specialized agents in parallel to test assumptions empirically.

Primary orchestrator: general-purpose agent
Validation specialists used: assumption-validator, performance-researcher, security-auditor, load-testing-specialist

Execute the validate-assumptions workflow for: [user's assumptions].

Perform systematic assumption validation:
1. Identify and classify assumptions (15%)
2. Validate all assumptions in parallel with experiments (55%)
3. Synthesize evidence and assess risks (15%)
4. Create action plan and mitigation strategies (15%)

Follow all phases, champion parallelism, enforce quality gates, and meet success criteria defined below."
```

**After delegation:**
- Validation agents work autonomously through testing
- Parallel execution for 3-5x speedup
- Return to main context only when complete or if user input required
- Do NOT attempt to execute workflow steps in main context

---

## Validate Assumptions Workflow Instructions for Orchestrator

Systematic workflow for testing and validating technical assumptions, architectural constraints, and design decisions through empirical evidence.

## Intelligence Database Integration

```bash
# Initialize workflow
echo "🔍 Starting Assumption Validation Workflow"
echo "Assumptions: $1"

# Query similar validation patterns from knowledge base
# Check for prior validations of similar assumptions
```

---

## Phase 1: Assumption Identification & Classification (0-15%)

**⚡ EXECUTE TASK TOOL:**
```
Use the assumption-validator or architect agent to:
1. Extract all stated and implicit assumptions
2. Classify assumptions by type and criticality
3. Define validation methodology for each
4. Prioritize by risk and impact
5. Create comprehensive validation plan

subagent_type: "orchestr8:research:assumption-validator"
description: "Identify, classify, and prioritize assumptions"
prompt: "Extract and classify assumptions for validation: $1

Tasks:
1. **Assumption Extraction**
   - Parse problem statement or project context
   - Identify stated assumptions (explicit)
   - Uncover implicit assumptions (hidden beliefs)
   - Review architecture/design documents
   - Interview stakeholders for unstated beliefs (if needed)

2. **Assumption Classification**
   By criticality:
   - **Critical:** Project viability depends on this being true
   - **High Impact:** Significant cost/effort if assumption is wrong
   - **Medium Impact:** Affects approach but not viability
   - **Low Impact:** Nice to know, minimal consequence if wrong

   By type:
   - **Performance:** "System can handle X requests/sec"
   - **Scalability:** "Database can store Y records efficiently"
   - **Cost:** "Infrastructure will cost $Z/month"
   - **Capability:** "Technology supports feature X"
   - **Compatibility:** "Works with our existing stack"
   - **Security:** "Approach is secure against threat X"
   - **Usability:** "Users can complete task in N steps"
   - **Reliability:** "Uptime will be >99.9%"

3. **Validation Strategy**
   For each assumption, define:
   - Test methodology (how to validate empirically)
   - Success criteria (what proves it true/false)
   - Resource requirements (time, tools, infrastructure)
   - Estimated validation time
   - Risk if assumption proves false

4. **Prioritization**
   - Rank by: (Impact if wrong) × (Uncertainty level)
   - Critical assumptions must be validated
   - High-impact assumptions should be validated
   - Low-impact can be accepted as risk

5. **Risk Matrix**
   - For each assumption: probability of being wrong
   - Impact if wrong (cost, time, technical debt)
   - Mitigation strategies if invalidated
   - Contingency plans

Expected outputs:
- .orchestr8/docs/research/assumptions/assumptions-inventory-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/assumptions-classified-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/validation-plan-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/risk-matrix-YYYY-MM-DD.md

Example Assumption Classification:
---
# Assumption A1: API Performance

**Type:** Performance
**Criticality:** Critical
**Assumption:** Our API will respond in <100ms at p95 for 95% of requests
**Impact if Wrong:** User experience degraded, may violate SLA, customers churn
**Validation Method:** Load test with realistic traffic pattern and data volume
**Success Criteria:** p95 latency <100ms at 5k req/sec with production data
**Priority:** Critical
**Risk Level:** High
**Confidence:** Low (not yet tested)
**Estimated Validation Time:** 4 hours
---
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/assumptions/assumptions-inventory-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/assumptions-classified-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/validation-plan-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/risk-matrix-YYYY-MM-DD.md`

**Quality Gate: Assumption Identification Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

ASSUMPTIONS_DIR=$(get_orchestr8_path "research" "assumptions")
VALIDATION_PLAN=$(find "$ASSUMPTIONS_DIR" -name "validation-plan-*.md" | head -1)

# Validate validation plan exists
if [ ! -f "$VALIDATION_PLAN" ]; then
  echo "❌ Validation plan not created"
  exit 1
fi

# Count critical assumptions (should have at least 1)
CRITICAL_COUNT=$(grep -c "Criticality: Critical" "$VALIDATION_PLAN" || echo "0")
if [ "$CRITICAL_COUNT" -lt 1 ]; then
  echo "⚠️ Warning: No critical assumptions identified"
fi

# Check for validation methods
if ! grep -q "Validation Method" "$VALIDATION_PLAN"; then
  echo "❌ Validation methods not defined"
  exit 1
fi

echo "✅ Identified and classified assumptions (${CRITICAL_COUNT} critical)"
```

---

## Phase 2: Parallel Validation Execution (15-70%)

**🚀 PARALLEL EXECUTION REQUIRED:** This is critical for validation efficiency. Execute all assumption validations IN PARALLEL using multiple Task calls in a SINGLE MESSAGE for maximum speed (3-5x speedup). Each validation agent works independently with isolated resources and outputs to separate files (no conflicts).

**For EACH critical/high-impact assumption, launch a validation experiment in parallel:**

### Assumption 1 Validation

**⚡ EXECUTE TASK TOOL (in parallel with others):**
```
Select appropriate specialist based on assumption type:
- Performance assumption → performance-researcher or load-testing-specialist
- Scalability assumption → database specialist or infrastructure specialist
- Security assumption → security-auditor
- Cost assumption → cloud specialist (aws/gcp/azure) or cost optimizer
- Compatibility assumption → relevant technology specialist

subagent_type: "[orchestr8:research:assumption-validator|orchestr8:quality:load-testing-specialist|orchestr8:quality:security-auditor|orchestr8:devops:aws-specialist]"
description: "Validate Assumption 1 with empirical experiment"
prompt: "Validate assumption from: .orchestr8/docs/research/assumptions/assumptions-classified-*.md (Assumption A1)

Validation plan: .orchestr8/docs/research/assumptions/validation-plan-*.md

Tasks:
1. **Experiment Setup**
   - Create test environment (isolated, production-like)
   - Prepare test data (realistic volume and characteristics)
   - Install necessary tools and monitoring
   - Configure metrics collection
   - Document environment specifications

2. **Experiment Execution**
   - Run controlled test per validation method
   - Collect quantitative data (metrics, timings, counts)
   - Document qualitative observations
   - Test edge cases and boundary conditions
   - Stress test to find breaking points
   - Run multiple iterations for statistical validity

3. **Data Collection**
   Based on assumption type:
   - Performance: latency (p50, p95, p99), throughput, resource usage
   - Scalability: performance at 1x, 10x, 100x scale
   - Cost: actual infrastructure costs, extrapolated monthly cost
   - Security: vulnerabilities found, penetration test results
   - Capability: feature works (yes/no), limitations discovered
   - Compatibility: integration successful, issues found

4. **Result Documentation**
   - Pass/fail determination against success criteria
   - Confidence level (high/medium/low) in result
   - Evidence supporting conclusion (data, logs, screenshots)
   - Limitations of test (what wasn't tested)
   - Unexpected findings
   - Recommendations if assumption fails

5. **Validation Methods by Type**

   **Performance Assumptions:**
   ```python
   # Load test example
   import locust

   class APILoadTest(locust.HttpUser):
       @locust.task
       def test_endpoint(self):
           self.client.get("/api/endpoint")

   # Run: locust -f test.py --users 5000 --spawn-rate 100
   # Analyze: p95 latency from results
   # Success: p95 <100ms at 5k users
   ```

   **Scalability Assumptions:**
   ```sql
   -- Database scalability test
   INSERT INTO users SELECT generate_series(1, 10000000) as id, ...;

   EXPLAIN ANALYZE SELECT * FROM users WHERE username LIKE 'user123%';

   -- Success: <50ms execution time at 10M records
   ```

   **Cost Assumptions:**
   ```bash
   # Deploy at target scale for 24 hours
   # Query AWS Cost Explorer
   aws ce get-cost-and-usage \\
     --time-period Start=2024-01-01,End=2024-01-02 \\
     --granularity DAILY \\
     --metrics BlendedCost

   # Extrapolate to monthly: daily_cost × 30
   # Success: ≤$5k/month
   ```

Expected outputs:
- .orchestr8/docs/research/assumptions/validation-results/assumption-1-results-YYYY-MM-DD.md
- .orchestr8/docs/research/poc/assumption-1/ (test code/config)
- .orchestr8/docs/research/assumptions/evidence/assumption-1/ (logs, screenshots, data)

CRITICAL: Use separate output directory for this assumption to avoid conflicts during parallel execution.

Result Format:
---
# Assumption A1 Validation Results

**Assumption:** [Restate assumption]

**Validation Method:** [How it was tested]

**Result:** ✅ VALIDATED / ❌ INVALIDATED / ⚠️ UNCERTAIN

**Evidence:**
- [Quantitative data point 1]
- [Quantitative data point 2]
- [Qualitative observation]

**Confidence Level:** High (95%) / Medium (75%) / Low (50%)

**Impact:** [If validated/invalidated, what does this mean?]

**Recommendations:** [Next steps based on result]

**Limitations:** [What wasn't tested or could affect results]
---
"
```

### Assumption 2 Validation (PARALLEL)
### Assumption 3 Validation (PARALLEL)
### Assumption 4 Validation (PARALLEL - if exists)
### Assumption 5 Validation (PARALLEL - if exists)

**[Repeat same pattern for each assumption with different output paths]**

**⚠️ ORCHESTRATION NOTE:**
```
Launch ALL assumption validations in a SINGLE MESSAGE with multiple Task tool calls.

Example for 5 assumptions:
- Single message containing 5 Task tool uses
- Each Task validates one assumption
- All execute simultaneously with isolated resources
- Each writes to separate results directory
- Total time = longest validation (not sum of all)

Speed advantage:
- Sequential: 5 assumptions × 2 hours = 10 hours
- Parallel: 5 assumptions in parallel = 2 hours (5x speedup)
```

**Expected Outputs (for all assumptions):**
- `.orchestr8/docs/research/assumptions/validation-results/assumption-1-results-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/validation-results/assumption-2-results-YYYY-MM-DD.md`
- `.orchestr8/docs/research/poc/assumption-*/` - Test code and configurations
- `.orchestr8/docs/research/assumptions/evidence/assumption-*/` - Supporting data

**Quality Gate: Validation Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

RESULTS_DIR=$(get_orchestr8_path "research/assumptions" "validation-results")

# Validate all assumption results exist
RESULTS_COUNT=$(find "$RESULTS_DIR" -name "assumption-*-results-*.md" | wc -l)
if [ "$RESULTS_COUNT" -lt 1 ]; then
  echo "❌ Missing assumption validation results"
  exit 1
fi

# Validate each result has verdict
for result_file in "$RESULTS_DIR"/assumption-*-results-*.md; do
  if [ ! -s "$result_file" ]; then
    echo "❌ Empty result file: $result_file"
    exit 1
  fi

  # Check for validation verdict
  if ! grep -qE "VALIDATED|INVALIDATED|UNCERTAIN" "$result_file"; then
    echo "❌ Missing validation verdict in: $result_file"
    exit 1
  fi
done

echo "✅ All ${RESULTS_COUNT} assumptions validated with empirical evidence"
```

---

## Phase 3: Evidence Synthesis & Risk Assessment (70-85%)

**⚡ EXECUTE TASK TOOL:**
```
Use the assumption-validator agent to:
1. Aggregate all validation results
2. Categorize by outcome (validated, invalidated, uncertain)
3. Assess project risk based on invalidated assumptions
4. Define mitigation strategies for failed assumptions
5. Update project plan if needed

subagent_type: "orchestr8:research:assumption-validator"
description: "Synthesize validation results and assess risks"
prompt: "Synthesize all assumption validation results and assess project risk:

Input files:
- .orchestr8/docs/research/assumptions/validation-results/assumption-*-results-*.md
- .orchestr8/docs/research/assumptions/risk-matrix-*.md

Tasks:
1. **Result Aggregation**
   - Compile all validation results
   - Categorize: validated, invalidated, uncertain
   - Calculate confidence levels
   - Identify conflicting evidence (if any)

2. **Outcome Analysis**
   - Count validated assumptions (good news)
   - Count invalidated assumptions (needs mitigation)
   - Count uncertain assumptions (needs more testing or accept risk)
   - Summarize impact on project

3. **Risk Analysis**
   For invalidated assumptions:
   - Assess impact on project (timeline, cost, viability)
   - Identify project risks created
   - Determine if project still viable
   - Calculate risk score (probability × impact)

4. **Mitigation Planning**
   For each invalidated assumption:
   - Define Plan B (alternative approach)
   - Estimate impact on timeline and cost
   - Identify alternative technologies/approaches
   - Create contingency plan

5. **Decision Points**
   - Validated assumptions → Proceed with confidence
   - Invalidated assumptions → Implement mitigations or find alternatives
   - Uncertain assumptions → Gather more evidence or accept calculated risk

6. **Project Impact Assessment**
   - Timeline impact (delays from mitigation)
   - Budget impact (additional costs)
   - Scope impact (features may need to change)
   - Risk impact (increased project risk)

Expected outputs:
- .orchestr8/docs/research/assumptions/synthesis/validation-summary-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/synthesis/invalidated-assumptions-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/synthesis/risk-assessment-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/synthesis/mitigation-strategies-YYYY-MM-DD.md

Summary Format:
---
# Validation Results Summary

## Validated Assumptions ✅ (X of Y)

### A1: [Name] - VALIDATED ✅
**Evidence:** [Key finding]
**Confidence:** High (95%)
**Impact:** Can proceed with planned approach
**Details:** [Summary]

## Invalidated Assumptions ❌ (X of Y)

### A3: [Name] - INVALIDATED ❌
**Evidence:** [Key finding that disproves assumption]
**Confidence:** High (90%)
**Impact:** Need to revise approach or budget
**Root Cause:** [Why assumption was wrong]
**Mitigation Options:**
1. Option A (cost, timeline)
2. Option B (cost, timeline)
**Recommendation:** [Best mitigation approach]

## Uncertain Assumptions ⚠️ (X of Y)

### A6: [Name] - UNCERTAIN ⚠️
**Evidence:** Mixed results
**Confidence:** Low (60%)
**Impact:** May affect long-term success
**Recommendation:** Extended testing or accept as calculated risk
---
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/assumptions/synthesis/validation-summary-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/synthesis/invalidated-assumptions-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/synthesis/risk-assessment-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/synthesis/mitigation-strategies-YYYY-MM-DD.md`

**Quality Gate: Synthesis Quality**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

SYNTHESIS_DIR=$(get_orchestr8_path "research/assumptions" "synthesis")
SUMMARY=$(find "$SYNTHESIS_DIR" -name "validation-summary-*.md" | head -1)

# Validate summary exists
if [ ! -f "$SUMMARY" ]; then
  echo "❌ Validation summary not created"
  exit 1
fi

# Check for categorization
if ! grep -qE "Validated|Invalidated|Uncertain" "$SUMMARY"; then
  echo "❌ Assumptions not categorized in summary"
  exit 1
fi

# Count invalidated assumptions
INVALIDATED_COUNT=$(grep -c "INVALIDATED" "$SUMMARY" || echo "0")
if [ "$INVALIDATED_COUNT" -gt 0 ]; then
  echo "⚠️ Warning: ${INVALIDATED_COUNT} assumptions invalidated - check mitigation strategies"

  # Ensure mitigation strategies exist
  MITIGATION=$(find "$SYNTHESIS_DIR" -name "mitigation-strategies-*.md" | head -1)
  if [ ! -f "$MITIGATION" ]; then
    echo "❌ Mitigation strategies missing for invalidated assumptions"
    exit 1
  fi
fi

echo "✅ Evidence synthesis complete with risk assessment"
```

---

## Phase 4: Action Plan & Knowledge Capture (85-100%)

**⚡ EXECUTE TASK TOOL:**
```
Use the general-purpose agent to:
1. Create actionable recommendations for each assumption
2. Update project plan and architecture docs
3. Prepare stakeholder communication
4. Capture learnings in knowledge base
5. Set up continuous monitoring for validated assumptions

subagent_type: "general-purpose"
description: "Generate action plan and capture knowledge"
prompt: "Create comprehensive action plan and knowledge artifacts:

Input files:
- .orchestr8/docs/research/assumptions/synthesis/validation-summary-*.md
- .orchestr8/docs/research/assumptions/synthesis/mitigation-strategies-*.md

Tasks:
1. **Action Plan Creation**
   For validated assumptions:
   - Document evidence for future reference
   - Proceed with planned approach confidently

   For invalidated assumptions:
   - Implement top mitigation strategy
   - Update architecture/design documents
   - Revise estimates (timeline, cost)

   For uncertain assumptions:
   - Define next steps (more testing, accept risk, change approach)
   - Set up monitoring for ongoing validation
   - Create contingency plans

2. **Project Updates**
   - Update architecture documents with validated constraints
   - Revise project timeline if delays from mitigation
   - Update budget estimates if additional costs
   - Document risks in risk register
   - Create updated project plan

3. **Stakeholder Communication**
   - Executive summary of validation findings
   - Impact on project timeline/budget/scope
   - Recommended course of action
   - Risk mitigation strategies
   - Decision points requiring approval

4. **Knowledge Capture**
   - Store validation methodology in knowledge base
   - Document learnings (what worked, what didn't)
   - Create reusable test templates
   - Record baseline metrics for future reference
   - Update organizational knowledge

5. **Continuous Validation**
   - Set up monitoring for validated assumptions (ensure they stay true)
   - Schedule re-validation for uncertain assumptions
   - Create alerts for assumption drift (when reality changes)
   - Define triggers for re-validation

Expected outputs:
- .orchestr8/docs/research/assumptions/action-plan-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/executive-summary-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/implementation-guide-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/monitoring-plan-YYYY-MM-DD.md
- .orchestr8/docs/knowledge/assumption-validation-[topic]-YYYY-MM-DD.md
"
```

**Expected Outputs:**
- `.orchestr8/docs/research/assumptions/action-plan-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/executive-summary-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/implementation-guide-YYYY-MM-DD.md`
- `.orchestr8/docs/research/assumptions/monitoring-plan-YYYY-MM-DD.md`
- `.orchestr8/docs/knowledge/assumption-validation-*.md`

**Quality Gate: Action Plan Completeness**
```bash
# Setup orchestr8
source "$(dirname "${BASH_SOURCE[0]}")/../scripts/setup-orchestr8-dirs.sh" 2>/dev/null || . "./setup-orchestr8-dirs.sh"

ASSUMPTIONS_DIR=$(get_orchestr8_path "research" "assumptions")
ACTION_PLAN=$(find "$ASSUMPTIONS_DIR" -name "action-plan-*.md" | head -1)
EXEC_SUMMARY=$(find "$ASSUMPTIONS_DIR" -name "executive-summary-*.md" | head -1)

# Validate action plan exists
if [ ! -f "$ACTION_PLAN" ]; then
  echo "❌ Action plan not created"
  exit 1
fi

# Validate executive summary exists
if [ ! -f "$EXEC_SUMMARY" ]; then
  echo "❌ Executive summary not created"
  exit 1
fi

# Check for concrete actions
if ! grep -qE "Action|Next Steps|Recommendation" "$ACTION_PLAN"; then
  echo "⚠️ Warning: Action plan may lack concrete next steps"
fi

echo "✅ Action plan complete with stakeholder materials"
```

---

## Workflow Completion

```bash
# Calculate total time
WORKFLOW_END=$(date +%s)

# Count results
VALIDATED=$(grep -c "VALIDATED ✅" "$SUMMARY" || echo "0")
INVALIDATED=$(grep -c "INVALIDATED ❌" "$SUMMARY" || echo "0")
UNCERTAIN=$(grep -c "UNCERTAIN ⚠️" "$SUMMARY" || echo "0")

echo "
✅ ASSUMPTION VALIDATION WORKFLOW COMPLETE

Assumptions Tested: $1

Validation Process:
✅ Identified and classified assumptions
✅ Validated all critical assumptions in parallel
✅ Collected empirical evidence through controlled experiments
✅ Assessed project risk based on results
✅ Created mitigation strategies for invalidated assumptions
✅ Generated action plan and stakeholder materials

Results Summary:
✅ Validated: ${VALIDATED} assumptions
❌ Invalidated: ${INVALIDATED} assumptions (mitigations defined)
⚠️ Uncertain: ${UNCERTAIN} assumptions (additional testing recommended)

Deliverables Created:
- Assumption inventory and classification
- Validation plan with methodology
- Empirical test results for each assumption
- Evidence synthesis and risk assessment
- Mitigation strategies for invalidated assumptions
- Action plan with next steps
- Executive summary for stakeholders

Key Artifacts:
- .orchestr8/docs/research/assumptions/validation-plan-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/validation-results/ (${RESULTS_COUNT} files)
- .orchestr8/docs/research/assumptions/synthesis/validation-summary-YYYY-MM-DD.md
- .orchestr8/docs/research/assumptions/action-plan-YYYY-MM-DD.md

Project Status: [Based on results - Proceed / Revise / High Risk]

Next Steps:
1. Review executive summary and validation results
2. Discuss invalidated assumptions with stakeholders
3. Implement mitigation strategies
4. Update project plan and timeline
5. Set up continuous monitoring for validated assumptions
"
```

---

## Success Criteria

Validation is complete when:
- ✅ All critical assumptions identified
- ✅ All assumptions tested empirically (not speculation)
- ✅ Clear pass/fail determination for each
- ✅ Confidence levels assessed with evidence
- ✅ Invalidated assumptions have mitigation plans
- ✅ Project risk reassessed based on results
- ✅ Stakeholders informed of findings
- ✅ Action plan created and approved
- ✅ Knowledge captured for reuse
- ✅ All quality gates passed

---

## Example Usage

### Example 1: E-commerce Platform
```
/orchestr8:validate-assumptions "
1. PostgreSQL can handle 50M products efficiently
2. Stripe can process 1000 transactions/sec
3. AWS costs will be under $10k/month at 100k users
4. Next.js can achieve Lighthouse score >90
5. Redis can handle 100k concurrent sessions
"

Results:
✅ PostgreSQL - VALIDATED (queries <30ms at 50M with proper indexes)
✅ Stripe - VALIDATED (supports 1k/sec in sandbox testing)
❌ AWS Costs - INVALIDATED ($14k projected, need optimization)
✅ Next.js - VALIDATED (Lighthouse 94 achieved)
⚠️ Redis - UNCERTAIN (works but high memory, may need cluster)

Actions:
- Implement cost optimizations (save $4.5k/month)
- Extended Redis testing under production load
- All other assumptions safe to proceed
```

### Example 2: Microservices Migration
```
/orchestr8:validate-assumptions "
1. Team can handle distributed system complexity
2. Service boundaries are clear enough
3. Network latency won't degrade performance
4. Kubernetes learning curve is manageable
5. Monitoring overhead is acceptable
"

Results:
⚠️ Team Capability - UNCERTAIN (mixed skill levels, needs training)
✅ Service Boundaries - VALIDATED (clear domain boundaries)
❌ Network Latency - INVALIDATED (adds 50-80ms per hop)
❌ K8s Learning - INVALIDATED (3-month ramp, steeper than expected)
✅ Monitoring - VALIDATED (Prometheus/Grafana working well)

Recommendation: Delay migration
- Start with modular monolith
- Extract 1-2 services for experience
- Invest in team training
- Re-evaluate in 6 months
```

---

## Anti-Patterns to Avoid

❌ Don't assume your assumptions are correct
❌ Don't skip validation to "save time"
❌ Don't use unrealistic test scenarios
❌ Don't hide or downplay negative results
❌ Don't proceed without mitigation plans for failures
❌ Don't ignore uncertain assumptions
❌ Don't forget to re-validate as context changes

✅ DO identify assumptions early in project
✅ DO test critical assumptions before major investment
✅ DO use realistic test scenarios and production data
✅ DO be honest about invalidated assumptions
✅ DO create concrete mitigation plans
✅ DO share findings with stakeholders promptly
✅ DO capture learnings for future projects

---

## Notes

- Validation is an investment that pays off through risk reduction
- **Parallel assumption testing is embarrassingly parallel: maximum speedup**
- Failed assumptions discovered early are much cheaper to fix than later
- Not all assumptions need validation: prioritize by risk × uncertainty
- Re-validate assumptions as context changes (technology, scale, requirements)
- Build continuous validation into monitoring for production
- Knowledge capture ensures validation insights aren't lost

**Remember:** "In God we trust; all others bring data." Validate assumptions before they become costly mistakes.
