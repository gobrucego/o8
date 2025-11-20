---
id: pattern-analysis-workflow
category: example
tags: [research, patterns, analysis, codebase-exploration]
relatedAgents: [pattern-learner, code-researcher]
useWhen:
  - Performing systematic codebase analysis to discover patterns
  - Extracting organizational conventions and best practices
  - Creating pattern libraries from existing code
estimatedTokens: 850
---

# Pattern Analysis Workflow

Complete workflow for discovering and documenting patterns in codebases.

## Phase 1: Codebase Analysis (30-60 minutes)

### Systematic Exploration

1. **Repository Structure**
   - Directory organization
   - Module boundaries
   - Naming conventions
   - File placement patterns

2. **Code Patterns**
   - Architectural patterns (MVC, Clean, etc.)
   - Design patterns (Factory, Strategy, etc.)
   - Common abstractions
   - Recurring implementations

3. **Testing Patterns**
   - Test organization
   - Mocking strategies
   - Test data management
   - Coverage expectations

### Analysis Commands

```bash
# Find common file patterns
find . -type f -name "*.ts" | grep -E "\.test\.ts$"
find . -type f -name "*.ts" | grep -E "\.spec\.ts$"

# Analyze imports (find common dependencies)
grep -r "^import.*from" --include="*.ts" | cut -d"'" -f2 | sort | uniq -c | sort -rn

# Find naming patterns
find . -name "*.service.ts"
find . -name "*Repository.ts"
find . -name "*Controller.ts"

# Analyze function patterns
grep -r "export.*function" --include="*.ts" | wc -l
grep -r "export.*const.*=" --include="*.ts" | wc -l
grep -r "export.*class" --include="*.ts" | wc -l

# Check for common patterns
grep -r "useEffect" --include="*.tsx" | wc -l
grep -r "useState" --include="*.tsx" | wc -l
grep -r "async.*function" --include="*.ts" | wc -l
```

## Phase 2: Pattern Identification (20-30 minutes)

### 1. Architectural Patterns

**Example: Layered Architecture**

Evidence:
- `/src/controllers/*` → HTTP layer
- `/src/services/*` → Business logic
- `/src/repositories/*` → Data access
- `/src/models/*` → Domain models

Convention:
- Controllers call services (never repositories directly)
- Services contain business logic
- Repositories handle DB operations
- Models are pure data structures

### 2. Naming Conventions

**Service Naming Pattern**: `[Entity][Action]Service`
- UserAuthenticationService
- ProductInventoryService
- OrderFulfillmentService

**Test Naming Pattern**: `[Method]_[Scenario]_[ExpectedBehavior]`
- `createUser_WithValidData_ReturnsUser`
- `createUser_WithDuplicateEmail_ThrowsError`
- `createUser_WithInvalidEmail_ThrowsValidationError`

### 3. Code Organization

**Feature-Based Structure**:
```
/src
  /features
    /auth
      - auth.service.ts
      - auth.controller.ts
      - auth.types.ts
      - auth.test.ts
    /products
      - products.service.ts
      - products.controller.ts
      - products.types.ts
      - products.test.ts
```

Convention:
- Each feature is self-contained
- Related files co-located
- Clear feature boundaries

## Phase 3: Best Practice Synthesis (15-20 minutes)

### High-Quality Code Examples

Find exemplary implementations:
- Well-tested modules (>90% coverage)
- Clear, readable code
- Good error handling
- Comprehensive documentation

Extract as templates for new code.

### Anti-Patterns (What to Avoid)

Find problematic patterns:
- Code with frequent bugs
- Complex, hard-to-maintain code
- Inconsistent implementations
- Performance bottlenecks

Document as "what NOT to do".

### Tooling & Automation

Identify effective tools:
- Linters and formatters (ESLint, Prettier)
- Testing frameworks and helpers
- CI/CD pipeline patterns
- Development scripts

## Phase 4: Knowledge Documentation (30-45 minutes)

### 1. Style Guide
Document coding conventions:
- Naming: variables, functions, classes, files
- Formatting: indentation, line length, spacing
- Comments: when, where, how
- Imports: order, grouping

### 2. Architecture Guide
Document system structure:
- Layers and responsibilities
- Module boundaries
- Data flow patterns
- Communication patterns

### 3. Pattern Library
Document common patterns:
- When to use
- Implementation template
- Example code
- Tests
- Common mistakes

## Pattern Categories to Document

### Project Structure Patterns

**1. Feature-Based Organization**
```
/src
  /features
    /[feature-name]
      - [feature].service.ts
      - [feature].controller.ts
      - [feature].repository.ts
      - [feature].types.ts
      - [feature].test.ts
```

Benefits:
- ✅ Co-location (easy to find related code)
- ✅ Clear boundaries
- ✅ Easy to delete feature

**2. Layer-Based Organization**
```
/src
  /controllers
  /services
  /repositories
  /models
  /utils
```

Benefits:
- ✅ Clear separation of concerns
- ✅ Easy to understand layers
- ✅ Traditional, familiar

### Naming Convention Patterns

**Files**:
- Components: PascalCase (`UserProfile.tsx`)
- Services: camelCase.service.ts (`userAuth.service.ts`)
- Tests: `*.test.ts` or `*.spec.ts`
- Types: `*.types.ts` or `*.d.ts`
- Config: kebab-case.config.ts

**Functions**:
- Actions: verb + noun (`getUser`, `createOrder`)
- Predicates: is/has/can + adjective (`isValid`, `hasPermission`)
- Handlers: handle + event (`handleClick`, `handleSubmit`)
- Async: async prefix or suffix (`fetchUser` or `getUserAsync`)

**Variables**:
- Boolean: is/has/should (`isLoading`, `hasError`)
- Arrays: plural (`users`, `products`)
- Single: singular (`user`, `product`)
- Constants: `UPPER_SNAKE_CASE` (`MAX_RETRIES`)

## Continuous Pattern Discovery

### Monitor Pull Requests
- Extract patterns from approved PRs
- Note reviewer feedback (what's valued)
- Update style guide based on discussions

### Track Common Changes
- Identify frequently modified code
- Extract refactoring patterns
- Document evolution of patterns

### Analyze Issues/Bugs
- Find bug-prone patterns (avoid these)
- Identify defensive patterns (use these)
- Update best practices

## Best Practices

### DO ✅
- Analyze existing codebase systematically
- Identify patterns by frequency (what repeats?)
- Document both good and bad patterns
- Provide concrete examples for each pattern
- Explain "why" behind patterns (not just "what")
- Make patterns discoverable (README, docs site)

### DON'T ❌
- Document patterns that don't exist (aspirational)
- Create patterns based on one example
- Ignore anti-patterns (document what NOT to do)
- Let documentation go stale
- Force patterns where they don't fit
