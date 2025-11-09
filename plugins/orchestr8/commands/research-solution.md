---
description: Research multiple solution approaches for a problem and recommend best option with evidence
argument-hint: [problem-description]
model: claude-sonnet-4-5
---

# Research Solution Workflow

This command is an alias for the `/orchestr8:research` workflow, optimized for solution discovery.

**Use this when:** You have a problem and want to explore multiple solution approaches before implementing.

**Immediate delegation to research workflow:**

Execute the core research workflow which will:
1. Analyze your problem and formulate 3-5 solution hypotheses
2. Test each solution approach in parallel
3. Compare results empirically with weighted scoring
4. Recommend the best solution with evidence

---

**Redirect to Core Workflow:**

This command delegates immediately to `/orchestr8:research` with the same parameters.

The research workflow will:
- Generate multiple solution hypotheses (typically 3-5 alternatives)
- Prototype and test each approach in parallel
- Collect empirical evidence (performance, complexity, cost, etc.)
- Perform comparative analysis with scoring matrix
- Recommend optimal solution with implementation roadmap

**Example Usage:**
```
/orchestr8:research-solution "How should we implement real-time notifications? Push notifications, WebSockets, Server-Sent Events, or polling?"
```

This will explore all mentioned approaches plus potentially discover additional ones, test them empirically, and recommend the best solution based on your requirements.

**See:** `/orchestr8:research` for complete workflow documentation.
