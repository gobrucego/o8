# Orchestr8 v3.0.0 Restructuring Plan

## Plugin Organization (matching wshobson/agents pattern)

### 1. database-specialists (9 agents)
- postgresql-specialist, mysql-specialist, oracle-specialist, sqlserver-specialist
- mongodb-specialist, cassandra-specialist, dynamodb-specialist, neo4j-specialist, redis-specialist

### 2. language-developers (11 agents)
- python-developer, typescript-developer, java-developer, go-developer, rust-developer
- csharp-developer, swift-developer, kotlin-developer, ruby-developer, php-developer, cpp-developer

### 3. frontend-frameworks (4 agents)
- react-specialist, nextjs-specialist, vue-specialist, angular-specialist

### 4. mobile-development (2 agents)
- swiftui-specialist, compose-specialist

### 5. game-development (3 agents)
- unity-specialist, godot-specialist, unreal-specialist

### 6. ai-ml-engineering (5 agents)
- langchain-specialist, llamaindex-specialist, ml-engineer, mlops-specialist, data-engineer

### 7. blockchain-web3 (2 agents)
- solidity-specialist, web3-specialist

### 8. api-design (3 agents)
- graphql-specialist, grpc-specialist, openapi-specialist

### 9. quality-assurance (8 agents)
- code-reviewer, test-engineer, debugger, security-auditor
- contract-testing-specialist, mutation-testing-specialist, load-testing-specialist, playwright-specialist

### 10. devops-cloud (4 agents)
- aws-specialist, terraform-specialist, azure-specialist, gcp-specialist

### 11. infrastructure-messaging (2 agents)
- kafka-specialist, rabbitmq-specialist

### 12. infrastructure-search (2 agents)
- elasticsearch-specialist, algolia-specialist

### 13. infrastructure-caching (2 agents)
- redis-cache-specialist, cdn-specialist

### 14. infrastructure-monitoring (4 agents)
- prometheus-grafana-specialist, elk-stack-specialist, observability-specialist, sre-specialist

### 15. compliance (5 agents)
- fedramp-specialist, iso27001-specialist, soc2-specialist, pci-dss-specialist, gdpr-specialist

### 16. orchestration (2 agents)
- project-orchestrator, feature-orchestrator

### 17. meta-development (4 agents)
- agent-architect, plugin-developer, workflow-architect, skill-architect

### 18. development-core (1 agent)
- architect, fullstack-developer

## Format Changes

### Agent Files:
- Change from YAML frontmatter to markdown table
- Remove `tools:` field
- Change model IDs: `claude-sonnet-4-5-20250929` → `sonnet`, `claude-opus-4` → `opus`

### Command Files:
- Remove YAML frontmatter entirely
- Start with markdown heading

### Skill Files:
- Move to `skills/[skill-name]/SKILL.md` format
- Implement 3-tier progressive disclosure

## Version: 3.0.0 (Breaking Change)
