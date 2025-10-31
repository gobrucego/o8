---
description: Add a complete feature with full lifecycle - analysis, implementation, testing, review, deployment
argumentHint: "[feature-description]"
---

# Add Feature Workflow

You are orchestrating the complete implementation of a new feature from requirements to deployment.

## Workflow Overview

Use the `feature-orchestrator` agent to coordinate this entire workflow.

## Execution Steps

### Phase 1: Analysis & Design (20%)

1. **Analyze Requirements**
   - Read and understand feature description
   - Identify affected components (frontend, backend, database)
   - List dependencies on existing code
   - Define acceptance criteria

2. **Design Implementation**
   - Design API contracts (if backend changes)
   - Design UI/UX changes (if frontend changes)
   - Design database changes (if data model affected)
   - Plan integration points
   - Define testing strategy

3. **Create Task Plan**
   Use TodoWrite to create detailed task list:
   - [ ] Database migrations (if needed)
   - [ ] Backend API implementation
   - [ ] Frontend implementation
   - [ ] Integration
   - [ ] Unit tests
   - [ ] Integration tests
   - [ ] E2E tests (if UI)
   - [ ] Documentation updates

**CHECKPOINT**: Review plan with user if complex feature

### Phase 2: Implementation (50%)

Execute tasks based on feature scope:

#### For Backend-Only Features
```
1. Use backend-developer or language-specific agent
2. Implement service layer
3. Add API endpoints
4. Write unit tests
5. Write integration tests
```

#### For Frontend-Only Features
```
1. Use frontend-developer
2. Implement UI components
3. Add client-side logic
4. Write component tests
5. Write E2E tests
```

#### For Full-Stack Features
```
1. Database changes (database-specialist if complex)
2. Backend implementation (parallel)
3. Frontend implementation (parallel, if API contract clear)
4. Integration
5. Comprehensive testing
```

**Parallelization:**
- Frontend and backend can develop in parallel if API contract is defined
- Different backend services can be developed in parallel
- Test writing can happen alongside implementation

### Phase 3: Quality Gates (20%)

Run all gates in parallel:

1. **Code Review** - `code-reviewer`:
   ```
   - Clean code principles
   - Best practices
   - SOLID principles
   - No code smells
   ```

2. **Testing** - `test-engineer`:
   ```
   - Adequate test coverage (>80%)
   - All tests passing
   - Edge cases covered
   ```

3. **Security** - `security-auditor`:
   ```
   - Input validation
   - No vulnerabilities
   - No secrets in code
   - OWASP compliance
   ```

4. **Performance** - `performance-analyzer` (if performance-critical):
   ```
   - No N+1 queries
   - Response times acceptable
   - Bundle size reasonable (frontend)
   ```

5. **Accessibility** - `accessibility-expert` (if UI changes):
   ```
   - WCAG 2.1 AA compliance
   - Keyboard navigation
   - Screen reader compatible
   ```

**All gates must PASS before proceeding**

### Phase 4: Documentation & Deployment (10%)

1. **Update Documentation**
   - README if user-facing changes
   - API docs if API changes
   - Code comments for complex logic
   - Architecture docs if design changed

2. **Create PR/Commit**
   - Descriptive commit message (Conventional Commits)
   - Link to issue/ticket
   - Summary of changes
   - Testing notes

3. **Deploy**
   - Deploy to staging
   - Run smoke tests
   - Deploy to production (if approved)
   - Monitor for errors

## Agent Selection Guide

**Backend Features:**
- Python: `python-developer`
- TypeScript/Node.js: `typescript-developer`
- Java: `java-developer`
- Go: `go-developer`
- Rust: `rust-developer`

**Frontend Features:**
- React/Next.js: `frontend-developer` or `typescript-developer`
- UI components: `frontend-developer`

**Full-Stack:**
- Use `fullstack-developer` when feature spans frontend + backend
- Or use `feature-orchestrator` to coordinate specialists

**Database:**
- Complex schemas: `database-specialist`
- Simple changes: Include in backend agent tasks

## Success Criteria

Feature is complete when:
- ✅ Acceptance criteria met
- ✅ All tests passing
- ✅ All quality gates passed
- ✅ Code reviewed and approved
- ✅ Documentation updated
- ✅ Deployed successfully
- ✅ Monitoring shows no errors
- ✅ User accepts feature

## Example Usage

```
/add-feature "Add real-time notifications using WebSockets.
Users should see notifications instantly when events occur.
Include notification history and mark as read functionality."
```

The feature orchestrator will:
1. Design WebSocket architecture
2. Implement backend WebSocket server
3. Implement frontend WebSocket client
4. Add notification UI components
5. Add database schema for notifications
6. Write comprehensive tests
7. Run all quality gates
8. Update documentation
9. Deploy to production

## Anti-Patterns to Avoid

❌ Don't skip quality gates to "move faster"
❌ Don't start coding without design
❌ Don't merge without tests
❌ Don't ignore security review
❌ Don't forget documentation
❌ Don't deploy without staging verification

## Notes

- Feature orchestrator maintains context and coordinates agents
- All quality gates must pass - no exceptions
- Tests written alongside implementation (TDD preferred)
- Parallel execution for maximum speed
- User intervention only for major decisions
