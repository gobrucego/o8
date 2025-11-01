---
name: modernize-legacy
description: Autonomous legacy code modernization from assessment to migration with zero downtime. Handles language upgrades, framework migrations, architecture refactoring, and comprehensive testing to transform legacy systems into modern, maintainable codebases.
---

# Modernize Legacy Workflow

Autonomous transformation of legacy codebases to modern patterns, languages, and architectures.

## Phases

### Phase 1: Assessment & Strategy (20-30 min)
**Objective**: Analyze legacy system and create modernization roadmap

**Tasks**:
1. **Codebase Analysis**
   - Identify technologies, frameworks, versions
   - Calculate code metrics (lines, complexity, test coverage)
   - Map dependencies and architecture
   - Identify deprecated APIs and libraries
   - Assess security vulnerabilities

2. **Risk Assessment**
   - Business-critical paths identification
   - Data migration complexity
   - Integration touchpoints
   - Downtime tolerance
   - Rollback requirements

3. **Modernization Strategy**
   - Incremental vs big-bang approach
   - Technology stack selection
   - Migration phases prioritization
   - Success metrics definition
   - Timeline estimation

**Agents**: `code-archaeologist`, `architect`, `dependency-analyzer`

**Deliverables**:
- Code analysis report with metrics
- Dependency graph
- Migration strategy document
- Risk matrix
- Project timeline

---

### Phase 2: Test Coverage Establishment (30-45 min)
**Objective**: Create comprehensive test suite for legacy code

**Tasks**:
1. **Characterization Tests**
   - Document current behavior
   - Create snapshot tests for critical paths
   - Test edge cases and error conditions
   - Establish performance baselines

2. **Integration Tests**
   - Test external dependencies
   - Database operations
   - API integrations
   - File system operations

3. **End-to-End Tests**
   - Critical user journeys
   - Business workflows
   - Data integrity checks

**Agents**: `test-engineer`, `debugger`

**Code Examples**:
```python
# Characterization test - document current behavior
def test_legacy_calculation_behavior():
    """Test captures current behavior before refactoring"""
    # Test various inputs
    assert legacy_calculate(100, 10) == 110  # Current behavior
    assert legacy_calculate(0, 5) == 5
    assert legacy_calculate(-10, 10) == 0

    # Edge cases
    assert legacy_calculate(None, 5) == 5  # Handles None
    assert legacy_calculate(100, None) == 100

# Approval testing for complex outputs
@approvals.verify()
def test_legacy_report_generation():
    return legacy_generate_report(sample_data)
    # First run creates approved file, subsequent runs compare
```

**Quality Gate**:
- [ ] 80%+ code coverage on critical paths
- [ ] All integration tests passing
- [ ] E2E tests for business-critical flows

---

### Phase 3: Incremental Modernization (varies by scope)
**Objective**: Modernize codebase incrementally with continuous validation

**Common Modernization Patterns**:

#### Pattern 1: Strangler Fig (recommended for large systems)
```python
# Step 1: Create new implementation alongside old
class ModernUserService:
    def create_user(self, data: UserCreateDTO) -> User:
        # Modern implementation with validation
        validated_data = UserCreateSchema.validate(data)
        return self.repository.create(validated_data)

# Step 2: Route traffic conditionally
class UserServiceRouter:
    def create_user(self, data):
        if feature_flags.use_modern_user_service():
            return modern_user_service.create_user(data)
        else:
            return legacy_user_service.create_user(data)

# Step 3: Gradually increase traffic to new service
# Step 4: Remove legacy code once 100% migrated
```

#### Pattern 2: Branch by Abstraction
```typescript
// Step 1: Extract interface from legacy code
interface PaymentProcessor {
  process(amount: number, card: CardDetails): Promise<PaymentResult>;
}

// Step 2: Implement interface with legacy code
class LegacyPaymentProcessor implements PaymentProcessor {
  async process(amount: number, card: CardDetails): Promise<PaymentResult> {
    return legacyProcessPayment(amount, card); // Wrapper
  }
}

// Step 3: Create modern implementation
class StripePaymentProcessor implements PaymentProcessor {
  async process(amount: number, card: CardDetails): Promise<PaymentResult> {
    return this.stripe.charges.create({ amount, source: card.token });
  }
}

// Step 4: Switch implementations
const processor: PaymentProcessor = config.useModernPayment
  ? new StripePaymentProcessor()
  : new LegacyPaymentProcessor();
```

#### Pattern 3: Parallel Run
```java
// Run both implementations and compare results
public class ParallelRunMigration {
    public Result processOrder(Order order) {
        Result legacyResult = legacyOrderProcessor.process(order);

        CompletableFuture.runAsync(() -> {
            try {
                Result modernResult = modernOrderProcessor.process(order);

                // Compare results
                if (!legacyResult.equals(modernResult)) {
                    logger.warn("Discrepancy detected: {} vs {}",
                        legacyResult, modernResult);
                    metrics.incrementDiscrepancies();
                }
            } catch (Exception e) {
                logger.error("Modern implementation failed", e);
                metrics.incrementModernFailures();
            }
        });

        // Return legacy result (safe fallback)
        return legacyResult;
    }
}
```

**Tasks by Modernization Type**:

**Language Upgrade** (e.g., Python 2→3, Java 8→17):
1. Update syntax (`print` statements → functions)
2. Replace deprecated APIs
3. Update dependencies
4. Fix type annotations
5. Run automated migration tools (2to3, OpenRewrite)

**Framework Migration** (e.g., Django 2→4, React class→hooks):
1. Update routing/middleware
2. Migrate ORM changes
3. Update template syntax
4. Replace deprecated components
5. Update authentication/session handling

**Architecture Refactoring** (e.g., Monolith→Microservices):
1. Identify bounded contexts
2. Extract domain logic
3. Create service interfaces
4. Implement event-driven communication
5. Deploy incrementally

**Agents**: Language-specific developers, `architect`, `code-reviewer`

**Quality Gates** (per increment):
- [ ] All existing tests still passing
- [ ] New code has 80%+ coverage
- [ ] Performance not degraded
- [ ] Security scan clean
- [ ] Code review approved

---

### Phase 4: Data Migration (if applicable, 15-30 min)
**Objective**: Migrate data with zero data loss

**Tasks**:
1. **Schema Migration**
   - Design new schema
   - Create migration scripts
   - Test on production-like data

2. **Data Transformation**
   - ETL pipelines for data transformation
   - Data validation and integrity checks
   - Handle edge cases and null values

3. **Dual-Write Strategy**
   ```python
   def save_user(user_data):
       # Write to both old and new database
       legacy_db.save_user(transform_to_legacy(user_data))
       new_db.save_user(user_data)

   def get_user(user_id):
       # Read from new, fallback to legacy
       user = new_db.get_user(user_id)
       if not user:
           user = legacy_db.get_user(user_id)
           # Backfill new DB
           new_db.save_user(user)
       return user
   ```

4. **Cutover Plan**
   - Stop writes to legacy DB
   - Migrate remaining data
   - Switch reads to new DB
   - Keep legacy as backup

**Agents**: `database-specialist`, `data-engineer`

---

### Phase 5: Performance Optimization (15-20 min)
**Objective**: Ensure modern code performs better than legacy

**Tasks**:
1. **Benchmark Comparison**
   - Legacy vs modern response times
   - Memory usage
   - Throughput
   - Database queries

2. **Optimization**
   - Add caching
   - Optimize queries (N+1 fixes)
   - Lazy loading
   - Connection pooling

3. **Load Testing**
   - Simulate production traffic
   - Identify bottlenecks
   - Stress testing

**Agents**: `performance-analyzer`, database specialists

**Code Example**:
```python
import pytest
import time

def test_performance_comparison():
    # Legacy implementation
    start = time.time()
    legacy_result = legacy_fetch_users(limit=1000)
    legacy_time = time.time() - start

    # Modern implementation
    start = time.time()
    modern_result = modern_fetch_users(limit=1000)
    modern_time = time.time() - start

    # Assert modern is not slower
    assert modern_time <= legacy_time * 1.2  # Allow 20% variance
    assert len(modern_result) == len(legacy_result)
```

---

### Phase 6: Documentation & Knowledge Transfer (10-15 min)
**Objective**: Document changes and train team

**Tasks**:
1. **Technical Documentation**
   - Architecture diagrams
   - API changes
   - Database schema changes
   - Deployment procedures

2. **Migration Guide**
   - What changed and why
   - Breaking changes
   - Migration path for remaining code
   - Troubleshooting guide

3. **Runbooks**
   - Deployment checklist
   - Rollback procedure
   - Monitoring and alerts
   - Common issues and fixes

**Agents**: `technical-writer`, `architecture-documenter`

---

### Phase 7: Deployment & Monitoring (20-30 min)
**Objective**: Deploy modernized code with zero downtime

**Strategies**:

**Blue-Green Deployment**:
1. Deploy modern version (Green)
2. Run smoke tests on Green
3. Switch traffic to Green
4. Keep Blue as instant rollback

**Canary Deployment**:
1. Deploy to 5% of servers
2. Monitor for 24h
3. Gradually increase (5% → 25% → 50% → 100%)
4. Rollback if issues detected

**Feature Flags**:
```typescript
if (featureFlags.isEnabled('modern_user_service', userId)) {
  return modernUserService.getUser(userId);
} else {
  return legacyUserService.getUser(userId);
}
```

**Monitoring**:
- Error rates comparison (legacy vs modern)
- Performance metrics
- User experience metrics
- Business metrics (conversion, revenue)

**Agents**: `ci-cd-engineer`, `sre-specialist`, `observability-specialist`

---

## Common Modernization Scenarios

### Scenario 1: Python 2 → Python 3
```bash
# Phase 1: Assessment
2to3 --print-diff src/

# Phase 2: Tests
pytest tests/ --cov=src/

# Phase 3: Migration
2to3 -w src/
# Fix print statements, unicode, iterators, exceptions

# Phase 4: Validation
pytest tests/
mypy src/
```

### Scenario 2: jQuery → React
```javascript
// Legacy jQuery
$('#userList').html(users.map(u => `<li>${u.name}</li>`).join(''));

// Modern React
function UserList({ users }) {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Scenario 3: Monolith → Microservices
```
1. Identify bounded context (Users, Orders, Payments)
2. Extract domain logic into modules
3. Create API layer for each module
4. Deploy as separate services
5. Implement event-driven communication
6. Migrate data to service-specific databases
```

---

## Quality Gates Summary

**Overall Success Criteria**:
- [ ] All tests passing (legacy + new)
- [ ] Code coverage ≥ 80%
- [ ] Performance equal or better
- [ ] Zero data loss
- [ ] Security vulnerabilities addressed
- [ ] Documentation complete
- [ ] Team trained
- [ ] Deployed to production
- [ ] Monitoring in place

---

## Rollback Plan

If issues arise:
1. **Immediate**: Feature flag to legacy code
2. **Blue-Green**: Switch traffic back to Blue
3. **Canary**: Reduce traffic to 0%
4. **Database**: Revert schema migrations
5. **Investigate**: Review logs, metrics, traces
6. **Fix**: Address issues in development
7. **Redeploy**: Try again with fixes

---

## Example Invocation

```bash
/modernize-legacy "Migrate Django 2.2 app to Django 4.2. Database: PostgreSQL with 10M+ records. Zero downtime required."

# Workflow executes:
# 1. Analyzes Django 2.2 app, identifies deprecated APIs
# 2. Creates comprehensive test suite
# 3. Incrementally updates (2.2 → 3.0 → 3.2 → 4.0 → 4.2)
# 4. Migrates database schema with dual-write
# 5. Performance testing and optimization
# 6. Documentation and runbooks
# 7. Canary deployment with monitoring
```

---

Transform legacy systems into modern, maintainable codebases with confidence and zero risk.
