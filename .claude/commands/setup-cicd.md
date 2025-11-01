---
name: setup-cicd
description: Autonomous CI/CD pipeline setup with GitHub Actions, GitLab CI, or Jenkins. Includes build, test, security scanning, Docker builds, and deployment automation with quality gates at every stage.
---

# Setup CI/CD Workflow

Autonomous CI/CD pipeline creation from build to deployment with comprehensive quality gates.

## Phases

### Phase 1: Analysis (5-10 min)
Analyze project stack, identify test frameworks, determine deployment targets, create pipeline strategy.

### Phase 2: Build Pipeline (15-20 min)
**GitHub Actions** example:
```yaml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: docker/build-push-action@v4
      - run: kubectl apply -f k8s/
```

### Phase 3: Quality Gates (10-15 min)
- Unit tests (80%+ coverage required)
- Integration tests
- Security scanning (Snyk, Trivy)
- Linting and formatting
- Docker image scanning

### Phase 4: Deployment (10-15 min)
Configure staging/production deployments with approval gates, rollback strategies, and monitoring.

**Deliverables**:
- Complete CI/CD pipeline
- Automated testing
- Security scanning
- Deployment automation
- Monitoring integration

Deliver production-ready CI/CD with automated quality gates and zero-touch deployments.
