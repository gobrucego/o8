---
id: code-exploration
category: skill
tags: [codebase-analysis, pattern-discovery, anti-patterns, code-quality, technical-debt, architecture]
capabilities:
  - Discovering architectural patterns through systematic codebase analysis
  - Identifying anti-patterns and code smells (God Object, Spaghetti Code, Circular Dependencies)
  - Measuring code quality metrics (complexity, coverage, maintainability)
  - Building organizational pattern libraries with real codebase examples
  - Technical debt auditing with effort estimation and prioritization
estimatedTokens: 740
useWhen:
  - Discovering architectural patterns in existing codebases requiring structural discovery with component diagrams, module dependency graphs, and layer identification
  - Identifying anti-patterns and code smells using detection tools (madge for circular deps, jscpd for duplication, ts-prune for unused code) with severity classification
  - Measuring code quality metrics using cloc for LOC, complexity-report for cyclomatic complexity, coverage tools, ESLint, SonarQube, and npm audit for vulnerabilities
  - Building organizational pattern libraries with pattern documentation including Category, Intent, Motivation, Applicability, Structure, Implementation examples, and Known Uses
  - Auditing technical debt requiring anti-pattern scanning, debt quantification (hours/days), risk scoring, business impact assessment, and prioritization by risk/effort ratio
  - Analyzing unfamiliar codebases for understanding through high-level architecture mapping, design pattern detection, quality assessment, and documentation generation
---

# Code Exploration Skill

Expert knowledge in systematic codebase exploration, architectural pattern discovery, anti-pattern identification, code quality measurement, and organizational pattern library construction.

## When to Use This Skill

**Use code-exploration for:**
- Discovering architectural patterns in existing codebases
- Identifying anti-patterns and code smells
- Measuring code quality metrics and technical debt
- Building organizational pattern libraries
- Analyzing unfamiliar codebases for understanding
- Creating pattern catalogs and best practice guides
- Auditing code consistency across projects
- Extracting reusable patterns for standardization

**Less critical for:**
- Simple code review of individual files
- Syntax checking or linting
- Single-file refactoring
- Basic code formatting

## Core Exploration Methodology

### Phase 1: Structural Discovery

**Objective**: Map the high-level architecture and identify major components.

```bash
# 1. Identify project structure
tree -L 3 -d  # Directory structure
find . -name "*.config.*" | head -20  # Config files
cat package.json | jq '.dependencies'  # Dependencies

# 2. Locate architectural boundaries
find . -name "index.*" -o -name "main.*" -o -name "__init__.py"
find . -type d -name "controllers" -o -name "services" -o -name "models"

# 3. Identify layers and modules
ls -la src/  # Source organization
ls -la tests/  # Test organization
```

**Expected Outputs:**
- Component diagram
- Module dependency graph
- Layer identification (presentation, business, data)
- Technology stack inventory

### Phase 2: Pattern Discovery

**Design Pattern Detection:**

```bash
# Singleton Detection
grep -r "private static.*instance" --include="*.ts"
grep -r "getInstance()" --include="*.ts"

# Factory Pattern Detection
grep -r "create[A-Z].*(" --include="*.ts"
find . -name "*Factory.ts"

# Observer Pattern Detection
grep -r "addEventListener\|on[A-Z].*(" --include="*.ts"
grep -r "subscribe\|emit" --include="*.ts"

# Dependency Injection Detection
grep -r "constructor.*inject" --include="*.ts"
grep -r "@Inject\|@Injectable" --include="*.ts"
```

**Architectural Pattern Detection:**

```bash
# MVC Pattern
ls src/models/ src/views/ src/controllers/

# Layered Architecture
ls src/presentation/ src/domain/ src/infrastructure/

# Microservices
find . -name "docker-compose.yml" -o -name "Dockerfile"

# Event-Driven
grep -r "EventEmitter\|EventBus" --include="*.ts"
find . -name "*Event.ts" -o -name "*Handler.ts"
```

### Phase 3: Anti-Pattern Identification

**Common Anti-Patterns:**

```bash
# God Object Detection (files > 500 lines or classes with > 20 methods)
find . -name "*.ts" -exec wc -l {} \; | sort -rn | head -20

# Spaghetti Code (deep nesting)
grep -r "if.*if.*if.*if" --include="*.ts"

# Magic Numbers
grep -r "[^0-9][0-9]{2,}[^0-9]" --include="*.ts" | grep -v "test"

# Hard-Coded Values
grep -r "http://\|https://" --include="*.ts" | grep -v ".env"
grep -r "password\|apiKey\|secret" --include="*.ts" | grep -v "test"

# Circular Dependencies
madge --circular src/

# Code Duplication
jscpd src/ --threshold 10

# Unused Code
ts-prune
```

**Anti-Pattern Categories:**

| Category | Examples | Detection Method |
|----------|----------|------------------|
| **Design** | God Object, Spaghetti Code | File size, complexity metrics |
| **Architecture** | Circular Dependencies, Tight Coupling | Dependency analysis |
| **Security** | Hard-coded Secrets, SQL Injection | Pattern matching, scanners |
| **Performance** | N+1 Queries, Premature Optimization | Query analysis, profiling |
| **Maintenance** | Dead Code, Commented Code | Static analysis, coverage |

### Phase 4: Quality Metrics

**Code Metrics to Collect:**

```bash
# Lines of Code
cloc src/ --json > metrics/loc.json

# Complexity Metrics
npx complexity-report src/ --format json > metrics/complexity.json

# Test Coverage
npm test -- --coverage --json > metrics/coverage.json

# Type Safety
tsc --noEmit --strict 2>&1 | tee metrics/type-errors.txt

# Code Quality
eslint src/ --format json > metrics/eslint.json

# Dependency Health
npm audit --json > metrics/vulnerabilities.json
npx depcheck --json > metrics/unused-deps.json
```

**Quality Score Calculation:**

```typescript
interface QualityMetrics {
  complexity: {
    average: number;        // Target: < 10
    max: number;            // Target: < 20
  };
  coverage: {
    lines: number;          // Target: > 80%
    branches: number;       // Target: > 75%
    functions: number;      // Target: > 80%
  };
  maintainability: {
    averageFileSize: number;  // Target: < 300 lines
    duplication: number;      // Target: < 5%
  };
  security: {
    vulnerabilities: {
      critical: number;     // Target: 0
      high: number;         // Target: 0
      medium: number;       // Target: < 5
    };
  };
}

function calculateQualityScore(metrics: QualityMetrics): number {
  const scores = {
    complexity: Math.max(0, 100 - (metrics.complexity.average - 5) * 10),
    coverage: (metrics.coverage.lines + metrics.coverage.branches + metrics.coverage.functions) / 3,
    maintainability: Math.max(0, 100 - (metrics.maintainability.duplication * 10)),
    security: metrics.security.vulnerabilities.critical === 0 ? 100 : 0
  };

  return Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
}
```

### Phase 5: Pattern Library Construction

**Pattern Documentation Template:**

```markdown
# Pattern: [Pattern Name]

## Category
[Design | Architectural | Integration | Testing]

## Intent
[One-line purpose]

## Motivation
[Why this pattern exists in our codebase]

## Applicability
Use when:
- [Scenario 1]
- [Scenario 2]

Avoid when:
- [Anti-scenario 1]

## Implementation

### Example 1: [Real codebase example]
```typescript
// From: src/services/UserService.ts
[Actual code from project]
```

## Consequences

**Benefits:**
- ✅ [Benefit 1]
- ✅ [Benefit 2]

**Tradeoffs:**
- ⚠️ [Tradeoff 1]

## Known Uses
- `src/services/UserService.ts` (line 42-78)
- `src/services/OrderService.ts` (line 125-156)

## Metrics
- **Frequency**: Used in 15 files
- **Consistency**: 85% adherence to standard implementation
```

## Code Exploration Workflows

### Workflow 1: New Codebase Analysis (60 minutes)

1. **Structure Discovery** (10 min) - Map directories, entry points, dependencies
2. **Pattern Recognition** (20 min) - Find architectural and design patterns
3. **Quality Assessment** (15 min) - Run metrics, check coverage, scan vulnerabilities
4. **Documentation** (15 min) - Create architecture diagram, document patterns

### Workflow 2: Pattern Library Creation (3.5 hours)

1. **Pattern Discovery** (30 min) - Scan all projects, identify recurring patterns
2. **Pattern Extraction** (60 min) - Extract real examples, generalize implementations
3. **Documentation** (90 min) - Write pattern docs, add UML diagrams, include metrics
4. **Validation** (30 min) - Review with team, test examples, publish library

### Workflow 3: Technical Debt Audit (90 minutes)

1. **Anti-Pattern Scan** (20 min) - Run automated scanners, manual review, catalog findings
2. **Debt Quantification** (30 min) - Estimate refactoring effort, calculate risk scores
3. **Prioritization** (20 min) - Sort by risk/effort ratio, group related items
4. **Reporting** (20 min) - Generate debt report, create dashboards, present findings

## Tools and Techniques

### Static Analysis Tools

**JavaScript/TypeScript:**
- ESLint - Code quality and style
- TypeScript Compiler - Type safety
- SonarQube - Code quality platform
- Madge - Dependency analysis
- JSCPD - Copy-paste detection
- ts-prune - Unused code detection

**Python:**
- Pylint - Code quality
- Mypy - Type checking
- Radon - Complexity metrics
- Bandit - Security analysis

**Java:**
- PMD - Static analysis
- Checkstyle - Code style
- SpotBugs - Bug detection
- JaCoCo - Code coverage

**General:**
- CLOC - Lines of code counter
- Git - History and authorship analysis

### Visualization Tools

```bash
# Generate dependency graphs
madge --image graph.png src/

# Create class diagrams from code
tplant --input src/**/*.ts --output diagram.puml

# Architecture visualization
npx arkit -o architecture.svg
```

## Best Practices

### DO ✅

**Exploration:**
- Start with automated tools, then manual review
- Document patterns as you discover them
- Use multiple detection methods for validation
- Prioritize high-impact findings
- Create visual representations of architecture
- Track metrics over time for trends
- Compare against industry benchmarks
- Engage team in pattern discussions

**Pattern Library:**
- Use real examples from actual codebase
- Include both good and bad examples
- Document rationale and tradeoffs
- Keep patterns updated with code evolution
- Make library searchable and accessible
- Include usage metrics and adoption rates
- Link patterns to related patterns
- Version pattern definitions

**Quality Metrics:**
- Automate metric collection
- Establish baselines before improvements
- Track trends, not just snapshots
- Use metrics to guide, not dictate
- Combine quantitative and qualitative analysis
- Focus on actionable metrics
- Share metrics transparently with team
- Set realistic improvement targets

### DON'T ❌

**Exploration:**
- Don't judge code without understanding context
- Don't rely solely on automated tools
- Don't ignore business constraints that influenced design
- Don't overlook positive patterns while hunting anti-patterns
- Don't create overly complex pattern taxonomies
- Don't forget to validate findings with team
- Don't expect perfect code everywhere

**Pattern Library:**
- Don't copy patterns from books without adaptation
- Don't create patterns that no one uses
- Don't make patterns too abstract to apply
- Don't ignore team feedback on patterns
- Don't enforce patterns dogmatically
- Don't let pattern library become stale

**Quality Metrics:**
- Don't use metrics as weapons
- Don't optimize for metrics at expense of business value
- Don't compare teams using metrics
- Don't set arbitrary thresholds without context
- Don't ignore qualitative aspects
- Don't chase 100% in all metrics

## Remember

1. **Start Broad, Then Deep**: High-level structure first, then dive into details
2. **Automate First**: Use tools for initial discovery, manual review for validation
3. **Document Continuously**: Capture patterns as you find them
4. **Quantify Quality**: Use metrics to track progress objectively
5. **Build Libraries**: Create reusable pattern documentation for organization
6. **Balance Analysis and Action**: Don't get stuck in analysis paralysis
7. **Engage Team**: Pattern discovery is collaborative, not solo
8. **Track Trends**: Single snapshots miss the story, track over time

Code exploration transforms unknown codebases into well-understood systems, extracts valuable patterns for organizational reuse, and provides objective quality metrics to guide continuous improvement.
