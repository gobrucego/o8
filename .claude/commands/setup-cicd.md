---
description: Autonomous CI/CD pipeline setup with GitHub Actions, GitLab CI, or Jenkins. Includes build, test, security scanning, Docker builds, and deployment automation with quality gates at every stage.
argumentHint: "[project-path] [ci-platform: github-actions|gitlab-ci|jenkins]"
---

# Setup CI/CD Workflow

Autonomous CI/CD pipeline creation from build to deployment with comprehensive quality gates.

## Intelligence Database Integration

```bash
source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh

# Initialize workflow
workflow_id="setup-cicd-$(date +%s)"
db_create_workflow "$workflow_id" "setup-cicd" "$*" 4 "high"
db_update_workflow_status "$workflow_id" "in_progress"

echo "🚀 Starting Setup CI/CD Workflow"
echo "Project: $1"
echo "CI Platform: ${2:-github-actions}"
echo "Workflow ID: $workflow_id"

# Query similar CI/CD setups
echo "=== Learning from past CI/CD implementations ==="
db_find_similar_workflows "setup-cicd" 5
```

---

## Phase 1: Analysis & Strategy (0-20%)

**⚡ EXECUTE TASK TOOL:**
```
Use the devops-engineer agent to:
1. Analyze project structure and tech stack
2. Identify test frameworks and commands
3. Determine build requirements
4. Assess deployment targets
5. Create CI/CD pipeline strategy

subagent_type: "devops-engineer"
description: "Analyze project and design CI/CD strategy"
prompt: "Analyze project for CI/CD pipeline setup:

Project Path: $1
CI Platform: ${2:-github-actions}

Tasks:

1. **Project Analysis**
   - Identify language(s) and frameworks
   - Find package manager (npm, pip, cargo, maven, gradle)
   - Locate test commands (package.json scripts, pytest, cargo test)
   - Identify build output directories
   - Determine runtime requirements

2. **Test Framework Detection**
   - Unit test framework (Jest, pytest, JUnit, RSpec, etc.)
   - Integration test setup (if present)
   - E2E test framework (Playwright, Cypress, Selenium, etc.)
   - Test coverage tools
   - Performance test tools (if applicable)

3. **Build Requirements**
   - Compilation needed? (TypeScript, Java, Go, Rust, C++)
   - Asset bundling (webpack, vite, rollup)
   - Docker image build
   - Binary artifacts
   - Version tagging strategy

4. **Deployment Targets**
   - Platform (AWS, Azure, GCP, Heroku, Vercel, Netlify)
   - Container orchestration (Kubernetes, ECS, Docker Swarm)
   - Serverless functions (Lambda, Cloud Functions)
   - Static hosting (S3, CloudFront, GitHub Pages)
   - Database migrations required

5. **Security & Quality Gates**
   - Dependency scanning (Snyk, npm audit, pip-audit)
   - SAST tools (SonarQube, CodeQL, Semgrep)
   - Secret detection (GitGuardian, TruffleHog)
   - Container scanning (Trivy, Clair)
   - License compliance

6. **Pipeline Strategy**
   - Branch strategy (main, develop, feature branches)
   - PR validation pipeline
   - Main branch deployment pipeline
   - Environment strategy (dev, staging, production)
   - Rollback strategy

Expected outputs:
- project-analysis.md with complete project assessment
- cicd-strategy.md with pipeline design
- List of required secrets/environment variables
"
```

**Expected Outputs:**
- `project-analysis.md` - Project tech stack and requirements
- `cicd-strategy.md` - Complete pipeline strategy
- `secrets-required.md` - Required secrets list

**Quality Gate: Analysis Validation**
```bash
# Validate project analysis exists
if [ ! -f "project-analysis.md" ]; then
  echo "❌ Project analysis not created"
  db_log_error "$workflow_id" "ValidationError" "Project analysis missing" "setup-cicd" "phase-1" "0"
  exit 1
fi

# Validate strategy document exists
if [ ! -f "cicd-strategy.md" ]; then
  echo "❌ CI/CD strategy not created"
  db_log_error "$workflow_id" "ValidationError" "CI/CD strategy missing" "setup-cicd" "phase-1" "0"
  exit 1
fi

# Validate CI platform specified
CI_PLATFORM="${2:-github-actions}"
if [[ ! "$CI_PLATFORM" =~ ^(github-actions|gitlab-ci|jenkins)$ ]]; then
  echo "⚠️  Unknown CI platform: $CI_PLATFORM, defaulting to github-actions"
  CI_PLATFORM="github-actions"
fi

echo "✅ Project analyzed and CI/CD strategy defined"
```

**Track Progress:**
```bash
TOKENS_USED=4000
db_track_tokens "$workflow_id" "analysis-strategy" $TOKENS_USED "20%"

# Store project analysis
db_store_knowledge "cicd-setup" "project-analysis" "$(basename $1)" \
  "Project analysis for CI/CD setup" \
  "$(head -n 50 project-analysis.md)"
```

---

## Phase 2: Build Pipeline Implementation (20-50%)

**⚡ EXECUTE TASK TOOL:**
```
Use the ci-cd-engineer agent to:
1. Create pipeline configuration file
2. Implement build job with caching
3. Add test job with coverage reporting
4. Configure artifact storage
5. Set up environment-specific configurations

subagent_type: "ci-cd-engineer"
description: "Implement build and test pipeline"
prompt: "Implement CI/CD build pipeline:

Project: $1
CI Platform: $CI_PLATFORM
Strategy: cicd-strategy.md

Tasks:

1. **Pipeline Configuration File**
   - GitHub Actions: .github/workflows/ci.yml
   - GitLab CI: .gitlab-ci.yml
   - Jenkins: Jenkinsfile

   Include:
   - Trigger conditions (push, PR, schedule)
   - Environment variables
   - Job definitions
   - Stage dependencies

2. **Build Job**
   - Checkout code
   - Set up language runtime (Node.js, Python, Java, Go, Rust)
   - Cache dependencies (node_modules, pip cache, cargo cache)
   - Install dependencies
   - Compile/build (if needed)
   - Cache build artifacts

   Example (GitHub Actions):
   \`\`\`yaml
   build:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with:
           node-version: '20'
           cache: 'npm'
       - run: npm ci
       - run: npm run build
       - uses: actions/upload-artifact@v4
         with:
           name: build-artifacts
           path: dist/
   \`\`\`

3. **Test Job**
   - Parallel execution where possible
   - Unit tests with coverage
   - Integration tests
   - E2E tests (if applicable)
   - Coverage report generation
   - Coverage threshold enforcement (80%+)

   Example:
   \`\`\`yaml
   test:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: actions/setup-node@v4
         with:
           node-version: '20'
           cache: 'npm'
       - run: npm ci
       - run: npm test -- --coverage
       - run: npm run test:integration
       - uses: codecov/codecov-action@v4
   \`\`\`

4. **Linting & Formatting**
   - Code linting (ESLint, Pylint, Clippy)
   - Code formatting (Prettier, Black, rustfmt)
   - Type checking (TypeScript, mypy)
   - Fail pipeline on violations

5. **Artifact Management**
   - Upload build artifacts
   - Store test results
   - Preserve coverage reports
   - Retention policies

Expected outputs:
- Pipeline configuration file (YAML/Jenkinsfile)
- Build job configured with caching
- Test job with coverage
- Linting/formatting jobs
"
```

**Expected Outputs:**
- `.github/workflows/ci.yml` OR `.gitlab-ci.yml` OR `Jenkinsfile` - Pipeline config
- Build job with dependency caching
- Test job with coverage reporting
- Linting and formatting jobs

**Quality Gate: Build Pipeline Validation**
```bash
# Log quality gate
db_log_quality_gate "$workflow_id" "build_pipeline" "running"

# Validate pipeline file exists
if [ "$CI_PLATFORM" = "github-actions" ]; then
  PIPELINE_FILE=".github/workflows/ci.yml"
elif [ "$CI_PLATFORM" = "gitlab-ci" ]; then
  PIPELINE_FILE=".gitlab-ci.yml"
else
  PIPELINE_FILE="Jenkinsfile"
fi

if [ ! -f "$PIPELINE_FILE" ]; then
  echo "❌ Pipeline configuration file not created"
  db_log_quality_gate "$workflow_id" "build_pipeline" "failed" 0 1
  exit 1
fi

# Validate required jobs present
if ! grep -qE "(build|test)" "$PIPELINE_FILE"; then
  echo "❌ Build/test jobs not configured"
  db_log_quality_gate "$workflow_id" "build_pipeline" "failed" 0 1
  exit 1
fi

# Validate caching configured
if ! grep -qE "(cache|caching)" "$PIPELINE_FILE"; then
  echo "⚠️  Warning: Caching not configured (builds may be slow)"
fi

# Log success
db_log_quality_gate "$workflow_id" "build_pipeline" "passed" 100 0
db_send_notification "$workflow_id" "quality_gate" "normal" "Build Pipeline Created" "CI/CD build pipeline configured for $CI_PLATFORM"

echo "✅ Build pipeline implemented and validated"
```

**Track Progress:**
```bash
TOKENS_USED=6000
db_track_tokens "$workflow_id" "build-pipeline" $TOKENS_USED "50%"

# Store pipeline configuration
db_store_knowledge "cicd-setup" "pipeline" "$(basename $1)" \
  "CI/CD pipeline configuration for $CI_PLATFORM" \
  "$(head -n 100 $PIPELINE_FILE)"
```

---

## Phase 3: Security & Quality Scanning (50-75%)

**⚡ EXECUTE TASK TOOL:**
```
Use the security-auditor agent to:
1. Add dependency vulnerability scanning
2. Configure SAST (Static Application Security Testing)
3. Set up secret detection
4. Add container image scanning (if Docker used)
5. Configure license compliance checking

subagent_type: "security-auditor"
description: "Add security scanning to CI/CD pipeline"
prompt: "Add comprehensive security scanning to CI/CD pipeline:

Pipeline File: $PIPELINE_FILE
CI Platform: $CI_PLATFORM

Tasks:

1. **Dependency Vulnerability Scanning**
   - Node.js: npm audit, Snyk
   - Python: pip-audit, Safety
   - Java: OWASP Dependency-Check
   - Go: govulncheck
   - Rust: cargo audit

   Example (GitHub Actions):
   \`\`\`yaml
   security-scan:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: snyk/actions/node@master
         env:
           SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
       - run: npm audit --audit-level=high
   \`\`\`

2. **SAST (Static Analysis)**
   - CodeQL (GitHub native)
   - SonarQube/SonarCloud
   - Semgrep
   - Language-specific linters with security rules

   Example (CodeQL):
   \`\`\`yaml
   codeql:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: github/codeql-action/init@v3
         with:
           languages: javascript, typescript
       - uses: github/codeql-action/autobuild@v3
       - uses: github/codeql-action/analyze@v3
   \`\`\`

3. **Secret Detection**
   - GitGuardian
   - TruffleHog
   - git-secrets
   - Prevent secrets in code/config

   Example:
   \`\`\`yaml
   secret-scan:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
         with:
           fetch-depth: 0
       - uses: trufflesecurity/trufflehog@main
         with:
           path: ./
   \`\`\`

4. **Container Scanning** (if Docker used)
   - Trivy
   - Clair
   - Anchore
   - Scan for OS vulnerabilities

   Example:
   \`\`\`yaml
   container-scan:
     runs-on: ubuntu-latest
     steps:
       - uses: actions/checkout@v4
       - uses: aquasecurity/trivy-action@master
         with:
           image-ref: my-app:latest
           severity: HIGH,CRITICAL
   \`\`\`

5. **License Compliance**
   - FOSSA
   - Black Duck
   - licensee
   - Ensure compatible licenses

6. **Quality Gates Configuration**
   - All security scans must pass
   - No HIGH/CRITICAL vulnerabilities allowed
   - No secrets detected
   - License compliance verified
   - Pipeline fails on violations

Expected outputs:
- Updated pipeline with security jobs
- Vulnerability scanning configured
- SAST tools integrated
- Secret detection enabled
- Container scanning (if applicable)
- security-requirements.md with needed secrets
"
```

**Expected Outputs:**
- Updated pipeline file with security jobs
- Vulnerability scanning configured
- SAST integration
- Secret detection
- `security-requirements.md` - Required security tool tokens

**Quality Gate: Security Integration Validation**
```bash
# Log quality gate
db_log_quality_gate "$workflow_id" "security_scanning" "running"

# Validate security jobs added
SECURITY_JOBS=0

if grep -qE "(snyk|npm audit|security)" "$PIPELINE_FILE"; then
  ((SECURITY_JOBS++))
fi

if grep -qE "(codeql|sonar|sast)" "$PIPELINE_FILE"; then
  ((SECURITY_JOBS++))
fi

if grep -qE "(secret|trufflehog|gitguardian)" "$PIPELINE_FILE"; then
  ((SECURITY_JOBS++))
fi

if [ "$SECURITY_JOBS" -lt 2 ]; then
  echo "❌ Insufficient security scanning configured (found $SECURITY_JOBS jobs, need 2+)"
  db_log_quality_gate "$workflow_id" "security_scanning" "failed" $SECURITY_JOBS 1
  exit 1
fi

# Validate security requirements documented
if [ ! -f "security-requirements.md" ]; then
  echo "⚠️  Warning: security-requirements.md not created (API tokens may be needed)"
fi

# Log success
db_log_quality_gate "$workflow_id" "security_scanning" "passed" 100 0
db_send_notification "$workflow_id" "quality_gate" "high" "Security Scanning Added" "$SECURITY_JOBS security jobs configured"

echo "✅ Security scanning integrated ($SECURITY_JOBS jobs configured)"
```

**Track Progress:**
```bash
TOKENS_USED=5000
db_track_tokens "$workflow_id" "security-scanning" $TOKENS_USED "75%"

# Store security configuration
db_store_knowledge "cicd-setup" "security" "$(basename $1)" \
  "Security scanning configuration" \
  "Jobs configured: $SECURITY_JOBS"
```

---

## Phase 4: Deployment & Monitoring (75-100%)

**⚡ EXECUTE TASK TOOL:**
```
Use the devops-engineer agent to:
1. Add Docker build and push (if applicable)
2. Configure staging deployment
3. Configure production deployment with approvals
4. Add deployment health checks
5. Set up monitoring and alerting
6. Create rollback procedures

subagent_type: "devops-engineer"
description: "Configure deployment and monitoring"
prompt: "Configure deployment automation and monitoring:

Pipeline File: $PIPELINE_FILE
CI Platform: $CI_PLATFORM
Strategy: cicd-strategy.md

Tasks:

1. **Docker Build & Push** (if applicable)
   - Multi-stage Dockerfile optimization
   - Build Docker image
   - Tag with commit SHA and version
   - Push to registry (Docker Hub, ECR, GCR, ACR)
   - Scan image with Trivy

   Example:
   \`\`\`yaml
   docker:
     needs: [test, security-scan]
     runs-on: ubuntu-latest
     if: github.ref == 'refs/heads/main'
     steps:
       - uses: actions/checkout@v4
       - uses: docker/setup-buildx-action@v3
       - uses: docker/login-action@v3
         with:
           registry: ghcr.io
           username: \${{ github.actor }}
           password: \${{ secrets.GITHUB_TOKEN }}
       - uses: docker/build-push-action@v5
         with:
           push: true
           tags: |
             ghcr.io/org/app:\${{ github.sha }}
             ghcr.io/org/app:latest
           cache-from: type=gha
           cache-to: type=gha,mode=max
   \`\`\`

2. **Staging Deployment**
   - Deploy on main branch push
   - Automatic deployment to staging
   - Run smoke tests
   - Health check validation

   Example (Kubernetes):
   \`\`\`yaml
   deploy-staging:
     needs: [docker]
     runs-on: ubuntu-latest
     environment: staging
     steps:
       - uses: actions/checkout@v4
       - uses: azure/setup-kubectl@v3
       - run: |
           kubectl set image deployment/app app=ghcr.io/org/app:\${{ github.sha }}
           kubectl rollout status deployment/app -n staging
       - name: Smoke Tests
         run: curl -f https://staging.app.com/health
   \`\`\`

3. **Production Deployment**
   - Manual approval required (GitHub Environments)
   - Deploy after staging validation
   - Blue-green or canary deployment
   - Health checks and validation
   - Automatic rollback on failure

   Example:
   \`\`\`yaml
   deploy-production:
     needs: [deploy-staging]
     runs-on: ubuntu-latest
     environment:
       name: production
       url: https://app.com
     steps:
       - uses: actions/checkout@v4
       - uses: azure/setup-kubectl@v3
       - name: Deploy
         run: |
           kubectl set image deployment/app app=ghcr.io/org/app:\${{ github.sha }}
           kubectl rollout status deployment/app -n production
       - name: Health Check
         run: |
           for i in {1..30}; do
             if curl -f https://app.com/health; then
               echo \"Health check passed\"
               exit 0
             fi
             sleep 10
           done
           echo \"Health check failed, rolling back\"
           kubectl rollout undo deployment/app -n production
           exit 1
   \`\`\`

4. **Deployment Health Checks**
   - Application health endpoint
   - Database connectivity
   - External service dependencies
   - Performance baseline validation
   - Rollback on failure

5. **Monitoring & Alerting**
   - Deployment notifications (Slack, Discord, email)
   - Error rate monitoring
   - Performance metrics
   - Log aggregation
   - Alert on anomalies

   Example (Slack notification):
   \`\`\`yaml
   notify:
     needs: [deploy-production]
     if: always()
     runs-on: ubuntu-latest
     steps:
       - uses: 8398a7/action-slack@v3
         with:
           status: \${{ job.status }}
           text: 'Deployment \${{ job.status }}'
           webhook_url: \${{ secrets.SLACK_WEBHOOK }}
   \`\`\`

6. **Rollback Procedures**
   - Document rollback steps
   - Automate rollback on failure
   - Database migration rollback (if needed)
   - Create rollback-guide.md

Expected outputs:
- Updated pipeline with deployment jobs
- Staging deployment configured
- Production deployment with approvals
- Health checks implemented
- Monitoring/alerting configured
- rollback-guide.md
- deployment-guide.md
"
```

**Expected Outputs:**
- Updated pipeline file with deployment jobs
- Staging and production deployment configured
- Health checks implemented
- Monitoring and alerting configured
- `rollback-guide.md` - Rollback procedures
- `deployment-guide.md` - Deployment documentation

**Quality Gate: Deployment Validation**
```bash
# Log quality gate
db_log_quality_gate "$workflow_id" "deployment" "running"

# Validate deployment jobs added
DEPLOYMENT_CONFIGURED=0

if grep -qE "(deploy|deployment)" "$PIPELINE_FILE"; then
  ((DEPLOYMENT_CONFIGURED++))
fi

if grep -qE "(docker|container)" "$PIPELINE_FILE"; then
  ((DEPLOYMENT_CONFIGURED++))
fi

# Validate health checks present
if grep -qE "(health|healthcheck)" "$PIPELINE_FILE"; then
  ((DEPLOYMENT_CONFIGURED++))
fi

if [ "$DEPLOYMENT_CONFIGURED" -lt 1 ]; then
  echo "⚠️  Warning: No deployment configuration found"
fi

# Validate documentation created
if [ ! -f "deployment-guide.md" ]; then
  echo "❌ Deployment guide not created"
  db_log_quality_gate "$workflow_id" "deployment" "failed" 0 1
  exit 1
fi

if [ ! -f "rollback-guide.md" ]; then
  echo "❌ Rollback guide not created"
  db_log_quality_gate "$workflow_id" "deployment" "failed" 0 1
  exit 1
fi

# Log success
db_log_quality_gate "$workflow_id" "deployment" "passed" 100 0
db_send_notification "$workflow_id" "quality_gate" "high" "Deployment Configured" "Full CI/CD pipeline ready"

echo "✅ Deployment and monitoring configured"
```

**Track Progress:**
```bash
TOKENS_USED=6000
db_track_tokens "$workflow_id" "deployment-monitoring" $TOKENS_USED "100%"

# Store deployment configuration
db_store_knowledge "cicd-setup" "deployment" "$(basename $1)" \
  "Deployment configuration for CI/CD" \
  "$(head -n 50 deployment-guide.md)"
```

---

## Workflow Completion & Learning

**At workflow end:**
```bash
# Calculate total token usage
TOTAL_TOKENS=$(($TOKENS_USED + 4000 + 6000 + 5000))
db_track_tokens "$workflow_id" "completion" $TOTAL_TOKENS "workflow-complete"

# Update workflow status
db_update_workflow_status "$workflow_id" "completed"

# Store lessons learned
db_store_knowledge "cicd-setup" "best_practice" "setup-cicd" \
  "CI/CD setup patterns for $CI_PLATFORM: Build with caching, comprehensive security scanning, automated deployment with health checks" \
  "Platform: $CI_PLATFORM, Security Jobs: $SECURITY_JOBS"

# Get final metrics
echo "=== Workflow Metrics ==="
db_workflow_metrics "$workflow_id"

# Send completion notification
DURATION=$(calculate_workflow_duration 2>/dev/null || echo "N/A")
db_send_notification "$workflow_id" "workflow_complete" "high" \
  "CI/CD Pipeline Setup Complete" \
  "CI/CD pipeline for $CI_PLATFORM configured. Token usage: ${TOTAL_TOKENS}."

# Display token savings
echo "=== Token Usage Report ==="
db_token_savings "$workflow_id" 2>/dev/null || echo "Token savings not available"

echo "
✅ SETUP CI/CD WORKFLOW COMPLETE

Project: $1
CI Platform: $CI_PLATFORM
Pipeline File: $PIPELINE_FILE

Files Created:
- $PIPELINE_FILE (CI/CD configuration)
- project-analysis.md
- cicd-strategy.md
- security-requirements.md
- deployment-guide.md
- rollback-guide.md

Pipeline Features:
✅ Build with dependency caching
✅ Automated testing with coverage
✅ Linting and code formatting
✅ Security scanning ($SECURITY_JOBS jobs)
✅ Deployment automation
✅ Health checks and monitoring
✅ Rollback procedures

Quality Gates Configured:
✅ Build Pipeline (automated)
✅ Security Scanning ($SECURITY_JOBS tools)
✅ Deployment Validation

Next Steps:
1. Review $PIPELINE_FILE configuration
2. Add required secrets to CI platform:
   - Review security-requirements.md for needed API tokens
   - GitHub: Settings → Secrets and variables → Actions
   - GitLab: Settings → CI/CD → Variables
   - Jenkins: Manage Jenkins → Credentials
3. Commit and push pipeline configuration:
   git add $PIPELINE_FILE project-analysis.md cicd-strategy.md
   git commit -m \"ci: add CI/CD pipeline with security scanning and deployment\"
   git push
4. Monitor first pipeline run
5. Configure deployment environments (staging, production)
6. Set up monitoring dashboards
7. Test rollback procedures (see rollback-guide.md)
8. Configure deployment notifications

Documentation:
- deployment-guide.md - How to deploy manually and via CI/CD
- rollback-guide.md - Rollback procedures for emergencies
- security-requirements.md - Required API tokens and secrets

Token Usage: ${TOTAL_TOKENS} tokens
"
```

---

## Success Criteria Checklist

- ✅ Project analyzed and tech stack identified
- ✅ CI/CD strategy designed
- ✅ Pipeline configuration file created
- ✅ Build job with dependency caching
- ✅ Test job with coverage reporting (80%+ threshold)
- ✅ Linting and formatting checks
- ✅ Dependency vulnerability scanning
- ✅ SAST (Static Application Security Testing)
- ✅ Secret detection configured
- ✅ Container scanning (if Docker used)
- ✅ Staging deployment automated
- ✅ Production deployment with approval gates
- ✅ Health checks and validation
- ✅ Monitoring and alerting configured
- ✅ Rollback procedures documented
- ✅ All quality gates passed
- ✅ Documentation complete (deployment-guide.md, rollback-guide.md)
- ✅ Pipeline ready for first run

---

## Platform-Specific Examples

### GitHub Actions

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3

  deploy:
    needs: [build, test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: echo "Deploy to production"
```

### GitLab CI

```yaml
stages:
  - build
  - test
  - security
  - deploy

build:
  stage: build
  image: node:20
  cache:
    key: $CI_COMMIT_REF_SLUG
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm test -- --coverage

security:
  stage: security
  image: node:20
  script:
    - npm audit

deploy:
  stage: deploy
  only:
    - main
  script:
    - echo "Deploy to production"
```

### Jenkins

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test -- --coverage'
            }
        }

        stage('Security Scan') {
            steps {
                sh 'npm audit'
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh 'echo "Deploy to production"'
            }
        }
    }
}
```

---

## Anti-Patterns to Avoid

❌ Don't skip security scanning to "move faster"
❌ Don't deploy without testing
❌ Don't ignore build warnings
❌ Don't commit secrets to repository
❌ Don't skip health checks on deployment
❌ Don't deploy to production without staging validation
❌ Don't forget to configure caching (slow builds)
❌ Don't skip rollback testing
❌ Don't ignore failed quality gates
❌ Don't hardcode credentials in pipeline

✅ Do use secret management (GitHub Secrets, GitLab Variables)
✅ Do implement comprehensive testing
✅ Do configure dependency caching
✅ Do use multiple security scanning tools
✅ Do require approvals for production
✅ Do implement automated rollback
✅ Do monitor deployments
✅ Do test your pipeline on feature branches
✅ Do document deployment procedures
✅ Do regularly update pipeline actions/images

---

## Example Usage

```bash
# GitHub Actions with default settings
/setup-cicd "/path/to/project"

# GitLab CI
/setup-cicd "/path/to/project" "gitlab-ci"

# Jenkins
/setup-cicd "/path/to/project" "jenkins"

# Node.js project with GitHub Actions
/setup-cicd "/Users/dev/my-app" "github-actions"

# Python project with GitLab CI
/setup-cicd "/Users/dev/python-api" "gitlab-ci"
```

---

## Notes

- Pipeline configuration is project-specific and may need manual adjustments
- Security tool API tokens must be added as secrets manually
- First pipeline run may fail until secrets are configured
- Deployment targets must be configured separately (AWS credentials, Kubernetes config)
- Database integration tracks setup patterns for continuous improvement
- All quality gates must pass - no exceptions
- Caching significantly speeds up builds (5-10x faster)
- Health checks prevent broken deployments reaching production
- Rollback procedures are critical for production stability
