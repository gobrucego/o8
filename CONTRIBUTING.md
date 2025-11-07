# Contributing to orchestr8

Welcome to orchestr8! We're excited that you're interested in contributing to our enterprise-grade autonomous software orchestration system for Claude Code. This guide will help you get started with contributing code, documentation, bug reports, and feature requests.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Code Standards](#code-standards)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Security Considerations](#security-considerations)
- [Questions and Support](#questions-and-support)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful, collaborative, and constructive in all interactions.

## Ways to Contribute

### 1. Code Contributions

- Add new specialized agents for languages, frameworks, or domains
- Create new workflow commands for common development tasks
- Develop reusable skills for auto-activated expertise
- Improve existing agent instructions and capabilities
- Optimize parallel execution patterns for better performance
- Enhance quality gates and validation logic

### 2. Documentation

- Improve README, ARCHITECTURE, or CLAUDE.md files
- Add examples and use case documentation
- Document best practices and patterns
- Create tutorials and guides
- Fix typos, clarify instructions, or improve readability

### 3. Bug Reports

- Report issues with existing agents or workflows
- Identify problems with plugin metadata or structure
- Document unexpected behavior or errors
- Suggest improvements to error handling

### 4. Feature Requests

- Propose new agents for additional languages or frameworks
- Suggest new workflow automations
- Request enhancements to existing functionality
- Share ideas for improving the orchestration system

### 5. Testing and Quality Assurance

- Write tests for agents and workflows
- Validate plugin structure and metadata
- Test edge cases and error scenarios
- Improve CI/CD pipeline checks

## Getting Started

### Prerequisites

- **Claude Code CLI** - The orchestr8 plugin runs within Claude Code
- **Git** - For version control
- **Text Editor** - VS Code, Vim, or your preferred editor
- **Basic Knowledge** - Familiarity with YAML, Markdown, and the Claude Code plugin system

### First-Time Contributors

1. **Read the Documentation**
   - [README.md](README.md) - Overview and feature list
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design and technical details
   - [plugins/orchestr8/CLAUDE.md](plugins/orchestr8/CLAUDE.md) - System instructions and patterns

2. **Explore the Codebase**
   - Browse `/plugins/orchestr8/agents/` - 79+ specialized agents
   - Check `/plugins/orchestr8/commands/` - 31 workflow commands
   - Review `/plugins/orchestr8/skills/` - Auto-activated expertise

3. **Find an Issue**
   - Look for issues labeled `good first issue` or `help wanted`
   - Check the [GitHub Issues](https://github.com/seth-schultz/orchestr8/issues) page
   - Ask in discussions if you need guidance

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/seth-schultz/orchestr8.git
cd orchestr8
```

### 2. Verify Directory Structure

Ensure the following structure exists:

```
orchestr8/
├── .claude-plugin/          # Root plugin metadata
│   └── marketplace.json     # Marketplace listing
├── plugins/orchestr8/       # Main plugin directory
│   ├── .claude-plugin/
│   │   └── plugin.json      # Plugin configuration
│   ├── agents/              # 79+ specialized agents
│   ├── commands/            # 31 workflow commands
│   ├── skills/              # Auto-activated expertise
│   ├── CLAUDE.md            # System instructions
│   └── ...
├── VERSION                  # Semantic version
├── README.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md          # This file
└── CHANGELOG.md
```

### 3. Test Locally in Claude Code

```bash
# In Claude Code, install the local plugin
/plugin add /path/to/orchestr8

# Verify installation
/plugin list

# Test a workflow
/orchestr8:add-feature "test feature"
```

### 4. Validate Your Changes

Before submitting a pull request, run local validation:

```bash
# Check markdown syntax
markdownlint '**/*.md' --ignore node_modules

# Validate agent frontmatter
find plugins/orchestr8/agents -name "*.md" | while read -r file; do
  if ! head -1 "$file" | grep -q "^---$"; then
    echo "ERROR: $file missing YAML frontmatter"
  fi
done

# Validate version consistency
VERSION_FILE=$(cat VERSION | tr -d '\n')
PLUGIN_VERSION=$(jq -r '.version' plugins/orchestr8/.claude-plugin/plugin.json)
if [ "$VERSION_FILE" != "$PLUGIN_VERSION" ]; then
  echo "ERROR: Version mismatch"
fi
```

## Project Architecture

### File-Based Agent System

orchestr8 uses a simple, file-based architecture:

- **Agents are Markdown Files** - Each agent is a `.md` file with YAML frontmatter
- **Direct File Reading** - Workflows read agent files directly from `/agents/` directory
- **Zero Infrastructure** - No servers, databases, or external dependencies
- **YAML Frontmatter** - Specifies model, capabilities, and metadata

### Agent File Structure

Every agent must follow this structure:

```yaml
---
name: agent-name
description: Clear description of when to invoke this agent
model: claude-sonnet-4-5
capabilities:
  - capability-1
  - capability-2
tools:
  - Read
  - Write
  - Bash
role: category
category: directory-category
---

# Agent Name

You are a specialized agent responsible for...

[Detailed agent instructions in markdown]
```

### Workflow Structure

Workflow commands are markdown files in `/plugins/orchestr8/commands/`:

```yaml
---
description: Brief description of what this workflow does
argumentHint: "[required-arg] [optional-arg]"
---

# Workflow Name

This workflow orchestrates...

## Steps

1. Analyze requirements
2. Invoke appropriate agents
3. Validate results
4. Generate outputs
```

### Skill Structure

Skills are markdown files in `/plugins/orchestr8/skills/`:

```yaml
---
name: skill-name
description: Domain expertise provided by this skill
triggers:
  - keyword1
  - keyword2
---

# Skill Name

[Auto-activated expertise and best practices]
```

## Code Standards

### SOLID Principles

All code and agent designs must follow SOLID principles:

- **Single Responsibility** - Each agent/function has one clear purpose
- **Open/Closed** - Extend behavior without modifying existing code
- **Liskov Substitution** - Subtypes must be substitutable for base types
- **Interface Segregation** - Many specific interfaces over one general interface
- **Dependency Inversion** - Depend on abstractions, not concretions

### Clean Code Practices

Follow these clean code principles:

- **Meaningful Names** - Use intention-revealing names for agents, variables, and functions
- **Small Functions** - Keep functions under 20 lines (focused and testable)
- **No Duplication** - Apply DRY (Don't Repeat Yourself) principle
- **Minimal Complexity** - Keep cyclomatic complexity under 10
- **Clear Error Handling** - Never fail silently, provide actionable error messages
- **Documentation** - Document complex logic, architectural decisions (ADRs), and non-obvious behavior

### Agent Design Standards

**Agent Naming:**
- Use kebab-case: `backend-developer.md`, `code-reviewer.md`
- Be specific and descriptive
- Reflect the agent's primary role

**Agent Instructions:**
- Start with clear role definition
- Provide specific, actionable guidance
- Include examples for complex scenarios
- Document expected inputs and outputs
- Specify when the agent should be invoked

**Agent Capabilities:**
- List all specific expertise areas
- Use consistent capability names across agents
- Enable effective agent discovery and selection

### Parallelism-First Design

When designing workflows or agents:

- **Identify Independent Tasks** - Look for operations that can run concurrently
- **Parallel Invocation** - Use multiple Task tool calls in a single message
- **Document Dependencies** - Clearly specify when sequential execution is required
- **Quality Gates** - Always run 5 quality gates in parallel for 5x speedup

Example:

```markdown
# ✅ GOOD - Parallel Execution
Invoke 3 agents simultaneously:
- backend-developer → API implementation
- frontend-developer → UI components
- database-specialist → Schema design

# ❌ BAD - Sequential Execution
Invoke backend-developer → wait
Invoke frontend-developer → wait
Invoke database-specialist → wait
```

## Commit Message Conventions

We follow **Conventional Commits** format for clear, semantic commit history:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature or functionality
- **fix**: Bug fix
- **docs**: Documentation changes only
- **chore**: Maintenance tasks (dependency updates, version bumps)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or updating tests
- **perf**: Performance improvements
- **ci**: CI/CD pipeline changes

### Scope (Optional)

The scope specifies what part of the codebase is affected:

- `agents`: Changes to agent definitions
- `workflows`: Changes to workflow commands
- `skills`: Changes to skill definitions
- `docs`: Documentation updates
- `ci`: CI/CD pipeline
- `plugin`: Plugin metadata or structure

### Examples

```bash
# Feature additions
feat(agents): add rust-specialist agent for Rust development
feat(workflows): create mobile-dev workflow for iOS and Android

# Bug fixes
fix(agents): correct YAML frontmatter in typescript-specialist
fix(workflows): fix parallel execution in add-feature workflow

# Documentation
docs: update README with research-driven development examples
docs(architecture): clarify agent discovery and invocation pattern

# Chores
chore: bump version to 6.2.0
chore(ci): add markdown linting to CI pipeline

# Refactoring
refactor(agents): consolidate database agent capabilities
```

### Commit Message Body

For complex changes, include a body explaining:

- **Why** the change was made (not just what)
- **Impact** on existing functionality
- **Breaking changes** (if any)
- **References** to related issues or PRs

Example:

```
feat(agents): add performance-researcher agent for empirical benchmarking

This agent enables research-driven performance optimization by:
- Testing multiple optimization approaches in parallel
- Benchmarking real-world performance impacts
- Comparing approaches with empirical data
- Recommending best approach with evidence

Closes #123
```

## Pull Request Process

### 1. Create a Feature Branch

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b feat/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Follow code standards and conventions
- Test your changes locally in Claude Code
- Update documentation as needed
- Add or update tests if applicable

### 3. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(agents): add elixir-specialist agent"

# Push to your fork
git push origin feat/your-feature-name
```

### 4. Create Pull Request

- **Title**: Use conventional commit format (`feat: add elixir-specialist agent`)
- **Description**: Explain what, why, and how
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include if relevant (especially for documentation)
- **Related Issues**: Link to related issues or discussions

### 5. Pull Request Template

```markdown
## Summary
Brief description of changes

## Motivation
Why is this change needed?

## Changes
- List of specific changes
- Bullet point format
- Clear and concise

## Testing
- How did you test this?
- What scenarios were covered?
- Any edge cases?

## Documentation
- What documentation was updated?
- Any new documentation added?

## Checklist
- [ ] Code follows project conventions
- [ ] Commit messages follow conventional commits
- [ ] Tests added/updated (if applicable)
- [ ] Documentation updated
- [ ] CI checks passing
- [ ] Version updated (if needed)
```

### 6. Code Review Process

**Review Expectations:**
- Respond to feedback within 48 hours
- Be open to suggestions and improvements
- Make requested changes or explain your reasoning
- Keep discussions respectful and constructive

**Reviewer Responsibilities:**
- Review within 2-3 business days
- Provide clear, actionable feedback
- Approve when standards are met
- Suggest improvements, don't demand perfection

### 7. After Approval

Once your PR is approved:
- Maintainers will merge using squash or rebase
- Your changes will be included in the next release
- You'll be credited in the CHANGELOG

## Testing Requirements

### Agent Testing

**Manual Testing:**
1. Load agent in Claude Code
2. Test with representative use cases
3. Verify agent follows instructions correctly
4. Check output quality and format
5. Validate error handling

**Validation Testing:**
- YAML frontmatter is valid
- All required fields present (name, description, model)
- Model specification is correct
- Capabilities are well-defined
- Instructions are clear and actionable

### Workflow Testing

**Functionality Testing:**
1. Invoke workflow with valid arguments
2. Verify all phases complete successfully
3. Check that outputs are generated correctly
4. Validate quality gates pass
5. Test error scenarios and edge cases

**Integration Testing:**
- Workflow invokes correct agents
- Parallel execution works as expected
- Agent coordination is smooth
- Dependencies are respected
- Context is properly managed

### CI/CD Pipeline

All pull requests automatically run:

- **Structure Validation** - Directory structure and required files
- **Metadata Validation** - Plugin JSON, frontmatter, version consistency
- **Markdown Linting** - Syntax and formatting
- **Link Checking** - Verify documentation links work
- **Security Scanning** - Secret detection, malicious pattern detection
- **Component Counting** - Verify agent/workflow counts match metadata

Ensure all CI checks pass before requesting review.

## Documentation Requirements

### Agent Documentation

Every agent must include:

- **YAML Frontmatter** - name, description, model, capabilities, tools, role, category
- **Role Definition** - Clear statement of agent's purpose
- **Responsibilities** - Specific tasks the agent handles
- **When to Invoke** - Scenarios where agent should be used
- **Input Requirements** - What information the agent needs
- **Output Specifications** - What the agent produces and where
- **Examples** - Sample invocations and use cases
- **Limitations** - Known constraints or edge cases

### Workflow Documentation

Every workflow must include:

- **Description** - What the workflow accomplishes
- **Argument Hint** - Expected parameters and format
- **Prerequisites** - Required setup or conditions
- **Phases** - Step-by-step execution flow
- **Agent Invocation** - Which agents are used and when
- **Quality Gates** - Validation performed
- **Outputs** - Generated artifacts and locations
- **Error Handling** - Common failures and recovery

### Skill Documentation

Every skill must include:

- **Name and Description** - Expertise area covered
- **Triggers** - Keywords for auto-activation
- **Best Practices** - Domain-specific guidelines
- **Common Patterns** - Recommended approaches
- **Anti-Patterns** - What to avoid
- **Examples** - Sample code or configurations
- **References** - Links to additional resources

### README Updates

When adding significant features:

- Update feature list
- Add usage examples
- Document new workflows or agents
- Update agent/workflow counts
- Add to appropriate sections

### ARCHITECTURE Updates

For architectural changes:

- Document design decisions
- Explain new patterns
- Update system diagrams
- Add rationale for changes

### CHANGELOG Updates

For every release:

- Follow Keep a Changelog format
- Categorize changes (Added, Changed, Fixed, Removed)
- Link to related issues/PRs
- Date each release

## Security Considerations

### Secret Management

**Never commit secrets:**
- No API keys, tokens, or credentials
- Use environment variables for sensitive data
- Reference secrets from secure storage
- Add `.env` files to `.gitignore`

**Detection:**
- CI pipeline runs Trufflehog secret scanning
- Pre-commit hooks can prevent accidental commits
- Review code carefully before committing

### Input Validation

**Agent Instructions:**
- Validate all user inputs
- Use parameterized queries for databases
- Sanitize outputs to prevent injection attacks
- Apply whitelist approach for validation

### Dependency Security

**Best Practices:**
- Keep dependencies minimal
- Review dependencies for known vulnerabilities
- Update dependencies regularly
- Prefer established, maintained packages

### OWASP Top 10

All code must comply with OWASP Top 10:

1. **Injection** - Use parameterized queries, validate inputs
2. **Broken Authentication** - Implement secure auth (OAuth2, JWT, MFA)
3. **Sensitive Data Exposure** - Encrypt sensitive data, use HTTPS
4. **XML External Entities** - Disable XXE in XML parsers
5. **Broken Access Control** - Enforce least privilege, validate permissions
6. **Security Misconfiguration** - Use secure defaults, keep software updated
7. **Cross-Site Scripting (XSS)** - Encode outputs, sanitize inputs
8. **Insecure Deserialization** - Validate serialized data, avoid native deserialization
9. **Using Components with Known Vulnerabilities** - Keep dependencies updated
10. **Insufficient Logging & Monitoring** - Log security events, monitor for anomalies

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Email security concerns privately
3. Include detailed description and reproduction steps
4. Allow time for maintainers to address the issue
5. Coordinate disclosure responsibly

## Questions and Support

### Getting Help

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For questions, ideas, and community support
- **Documentation** - Check README, ARCHITECTURE, and CLAUDE.md files
- **Examples** - Browse existing agents, workflows, and skills

### Communication Channels

- **Issues** - Bug reports, feature requests, roadmap discussions
- **Pull Requests** - Code review, implementation feedback
- **Discussions** - General questions, best practices, use case sharing

### Response Times

- **Issues** - Typically reviewed within 2-3 business days
- **Pull Requests** - Code review within 2-3 business days
- **Security Issues** - Immediate attention, response within 24 hours
- **Questions** - Community and maintainers respond as available

## Recognition

We value all contributions! Contributors will be:

- Credited in release notes
- Mentioned in CHANGELOG
- Recognized in GitHub contributor list
- Thanked in release announcements

## License

By contributing to orchestr8, you agree that your contributions will be licensed under the MIT License, the same license as the project.

## Thank You!

Thank you for contributing to orchestr8! Your contributions help make autonomous software orchestration better for everyone. Whether you're fixing a typo, adding a new agent, or proposing architectural improvements, every contribution matters.

Happy coding!

---

**Made with care for the orchestr8 community**
