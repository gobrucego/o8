---
description: Empirically compare 2-3 specific approaches with benchmarks and feature analysis
argument-hint: [approach1] [approach2] [approach3-optional]
model: claude-sonnet-4-5
---

# Compare Approaches Workflow

This command is an alias for the `/orchestr8:benchmark` workflow, optimized for direct approach comparison.

**Use this when:** You already know the 2-3 approaches you want to compare and need empirical data to choose between them.

**Immediate delegation to benchmark workflow:**

Execute the core benchmark workflow which will:
1. Set up fair comparison environment for all approaches
2. Run comprehensive benchmarks in parallel
3. Compare performance, features, cost, and developer experience
4. Provide evidence-based recommendation

---

**Redirect to Core Workflow:**

This command delegates immediately to `/orchestr8:benchmark` with the specified approaches as candidates.

The benchmark workflow will:
- Define comprehensive benchmark plan for your specific approaches
- Execute all benchmarks in parallel (2-3x speedup)
- Collect performance metrics (latency, throughput, resource usage)
- Assess feature completeness and developer experience
- Perform cost analysis (infrastructure + development time)
- Generate weighted scoring matrix
- Recommend best approach with trade-off analysis

**Example Usage:**
```
/orchestr8:compare-approaches "Next.js" "Remix" "SvelteKit"
```

This will benchmark all three frameworks with:
- Build time and bundle size comparison
- Runtime performance (Lighthouse scores, TTI)
- Developer experience assessment
- Ecosystem and tooling evaluation
- Final recommendation based on empirical data

**Difference from `/orchestr8:research`:**
- `compare-approaches`: You specify exactly which options to compare (2-3 known approaches)
- `research`: System generates multiple hypotheses for you (3-5 alternatives discovered)

**See:** `/orchestr8:benchmark` for complete workflow documentation.
