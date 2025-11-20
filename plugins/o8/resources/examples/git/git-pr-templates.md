---
id: git-pr-templates
category: example
tags: [git, pull-requests, github, code-review, templates, collaboration, documentation, workflow]
capabilities:
  - Create structured pull request descriptions
  - Standardize PR format across team
  - Improve code review efficiency
  - Document changes systematically
useWhen:
  - Creating pull requests for features or fixes
  - Setting up PR templates for a repository
  - Establishing code review standards
  - Need consistent PR documentation format
  - Improving team collaboration on code reviews
  - Onboarding new developers to PR process
  - Implementing GitHub/GitLab workflows
  - Ensuring quality control before merging
relatedResources:
  - git-commit-examples
  - git-hooks-implementations
  - github-actions-workflows
  - code-quality-standards
  - review-code
  - git-workflow
estimatedTokens: 620
---

# Git Pull Request Templates

## Scenario

Creating standardized PR templates for different types of changes to improve code review quality, ensure consistent documentation, and streamline the review process.

## Implementation

### Feature Pull Request Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE/feature_template.md -->

## 🚀 Feature Description

**What does this PR do?**
A clear and concise description of the feature.

**Why is this needed?**
Explain the problem this feature solves or the value it adds.

## 🔗 Related Issues

Closes #[issue_number]
Related to #[issue_number]

## 📋 Changes Made

- [ ] List specific changes
- [ ] Include API modifications
- [ ] Note database schema updates
- [ ] Mention configuration changes

## 🧪 Testing

**Test Coverage:**
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

**Test Scenarios:**
1. Describe key test scenario
2. Describe edge cases tested
3. Describe error handling verified

**Test Results:**
```
Paste relevant test output or coverage report
```

## 📸 Screenshots/Recordings

<!-- If UI changes, include before/after screenshots or demo video -->

**Before:**
[Screenshot or description]

**After:**
[Screenshot or description]

## 🔍 Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (README, API docs, etc.)
- [ ] No console logs or debugging code
- [ ] Performance implications considered
- [ ] Security implications reviewed
- [ ] Backward compatibility maintained

## 🚀 Deployment Notes

**Migration Required:** Yes/No
**Feature Flags:** List any feature flags used
**Configuration Changes:** Describe any config updates needed
**Rollback Plan:** Describe how to rollback if needed

## 📝 Additional Context

Add any other context, design decisions, or trade-offs made.

---
**Reviewer Guidelines:**
- Focus on logic, security, and architecture
- Check test coverage and quality
- Verify documentation completeness
```

### Bug Fix Pull Request Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE/bugfix_template.md -->

## 🐛 Bug Fix Description

**What was the bug?**
Clear description of the issue being fixed.

**What was the root cause?**
Explain what caused the bug.

## 🔗 Related Issues

Fixes #[issue_number]

## 📋 Changes Made

- [ ] Specific fix applied
- [ ] Related code updated
- [ ] Edge cases handled

## 🧪 Testing

**Reproduction Steps (Before Fix):**
1. Step to reproduce
2. Expected vs actual behavior
3. Error messages or symptoms

**Verification Steps (After Fix):**
1. How to verify the fix
2. Expected behavior now
3. Edge cases tested

**Test Coverage:**
- [ ] Regression test added
- [ ] Existing tests pass
- [ ] Manual verification completed

## 📊 Impact Analysis

**Severity:** Critical / High / Medium / Low
**Affected Versions:** List versions with the bug
**User Impact:** Describe who was affected and how

## 🔍 Code Review Checklist

- [ ] Fix addresses root cause, not just symptoms
- [ ] No similar bugs in related code
- [ ] Error handling is appropriate
- [ ] Logging added for debugging
- [ ] Performance not negatively impacted

## 🚀 Deployment Priority

**Urgency:** Immediate / High / Normal
**Deployment Notes:** Any special considerations
**Rollback Risk:** Low / Medium / High
```

### Hotfix Pull Request Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE/hotfix_template.md -->

## 🚨 HOTFIX

**Critical Issue:**
Brief description of the production issue.

**Business Impact:**
What is broken and who is affected?

## 🔗 Related Incident

Incident Ticket: #[incident_number]
Slack Thread: [link]

## 🔥 The Fix

**What's being changed:**
Minimal description of the fix.

**Why this approach:**
Justification for the hotfix approach.

## ✅ Verification

- [ ] Fix tested in staging/production-like environment
- [ ] No other systems affected
- [ ] Rollback plan confirmed
- [ ] Monitoring in place

**Manual Test Results:**
```
Describe manual testing performed
```

## 🚀 Deployment Plan

1. Deploy to staging: [timestamp]
2. Verify fix: [verification steps]
3. Deploy to production: [timestamp]
4. Monitor for [X] minutes

**Rollback Command:**
```bash
git revert [commit-hash]
# or
kubectl rollout undo deployment/[name]
```

## 📢 Communication

- [ ] Stakeholders notified
- [ ] Status page updated
- [ ] Post-mortem scheduled

## ⚠️ Follow-up Tasks

- [ ] Create proper fix for next release
- [ ] Add regression tests
- [ ] Update documentation
- [ ] Review related code

---
**⚡ EXPEDITED REVIEW NEEDED ⚡**
```

### Default Pull Request Template

```markdown
<!-- .github/pull_request_template.md -->

## Description

Please include a summary of the change and which issue is fixed.

Fixes # (issue)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test updates

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

## Explanation

**Template Placement:**
- **Default template**: `.github/pull_request_template.md`
- **Multiple templates**: `.github/PULL_REQUEST_TEMPLATE/` directory
- Users can select appropriate template when creating PR

**Template Benefits:**
- **Consistency**: Standardized information across all PRs
- **Completeness**: Ensures critical information isn't forgotten
- **Efficiency**: Faster reviews with structured information
- **Documentation**: Better project history and decision tracking

**Best Practices:**
- Keep templates concise but comprehensive
- Include checklists to guide contributors
- Add links to relevant documentation
- Use emoji sparingly for visual hierarchy
- Customize templates for your team's workflow
- Include reviewer guidelines
- Reference related issues/tickets
- Document deployment considerations
