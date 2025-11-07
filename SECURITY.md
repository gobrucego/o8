# Security Policy

## Reporting Security Vulnerabilities

The orchestr8 team takes security seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

### Responsible Disclosure Process

If you discover a security vulnerability in orchestr8, please follow these steps:

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. **DO NOT** disclose the vulnerability publicly until we have had a chance to address it
3. Report your findings through [GitHub's private vulnerability reporting feature](https://github.com/seth-schultz/orchestr8/security/advisories)
4. Include detailed information about the vulnerability (see below)
5. Allow us reasonable time to respond and address the issue before public disclosure

### What to Include in Your Report

To help us understand and address the vulnerability quickly, please include:

- **Type of vulnerability**: (e.g., SQL injection, XSS, authentication bypass, etc.)
- **Full paths of source file(s)** related to the vulnerability
- **Location of the affected code** (tag/branch/commit or direct URL)
- **Step-by-step instructions** to reproduce the issue
- **Proof-of-concept or exploit code** (if possible)
- **Impact assessment**: What an attacker could potentially do
- **Suggested remediation** (if you have ideas)
- **Your name and affiliation** (for acknowledgment, if desired)

### GitHub Private Vulnerability Reporting

Use GitHub's private vulnerability reporting feature for all security disclosures. This ensures:
- Encrypted communication within GitHub
- Automatic creation of a private security advisory
- Coordinated disclosure timeline
- Credit for responsible disclosure

## Response Timeline

We are committed to responding to security reports in a timely manner:

- **Initial Response**: Within 48 hours of receiving your report
- **Vulnerability Assessment**: Within 5 business days, we will provide an assessment of the reported vulnerability
- **Fix Timeline**:
  - **Critical vulnerabilities**: Patch within 7 days
  - **High severity**: Patch within 30 days
  - **Medium/Low severity**: Patch in next release cycle
- **Public Disclosure**: Coordinated disclosure after patch is released and users have had time to update (typically 90 days)

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Status Updates**: We will keep you informed about our progress
3. **Validation**: We will work to validate and reproduce the issue
4. **Fix Development**: We will develop and test a fix
5. **Credit**: With your permission, we will credit you in our security advisories and CHANGELOG
6. **Disclosure**: We will coordinate public disclosure with you

## Scope

### In Scope

The following components and security concerns are within scope for vulnerability reports:

**Core System:**
- orchestr8 plugin code and workflows
- Agent definitions and execution logic
- Knowledge capture system and database
- Async execution architecture (MCP server)
- File handling and path resolution
- Environment variable processing

**Security Concerns:**
- Authentication and authorization issues
- Code injection vulnerabilities
- Path traversal attacks
- Secrets exposure
- Arbitrary code execution
- Supply chain vulnerabilities (malicious agents/workflows)
- Command injection through user input
- Unsafe file operations
- Privilege escalation
- Data leakage or exposure

**Third-Party Dependencies:**
- Vulnerabilities in direct dependencies (if not already publicly known and patched)

### Out of Scope

The following are typically **NOT** considered security vulnerabilities:

- Issues in Claude Code itself (report to Anthropic)
- Issues in third-party plugins (report to plugin maintainer)
- Denial of service through resource exhaustion (orchestr8 is meant to be run locally)
- Social engineering attacks
- Physical attacks
- Vulnerabilities requiring physical access to the user's machine
- Issues already publicly disclosed and for which a patch exists
- Browser-specific issues (orchestr8 is a CLI tool)
- Missing security headers (not applicable to CLI tools)
- Missing rate limiting (not applicable to local tools)

If you are unsure whether something is in scope, please reach out and ask.

## Security Best Practices for Users

To use orchestr8 securely, we recommend following these best practices:

### 1. Keep orchestr8 Updated

Always use the latest version of orchestr8:

```bash
/plugin update orchestr8@seth-schultz/orchestr8
```

Subscribe to security advisories by watching the repository for security updates.

### 2. Review Agent and Workflow Code

orchestr8 agents and workflows are markdown files with execution instructions. Before using custom agents or workflows:

- Review the agent/workflow code for suspicious operations
- Verify the source of third-party agents
- Be cautious with agents that execute shell commands
- Check for hardcoded secrets or credentials

### 3. Protect Sensitive Data

- **Never** commit `.env` files or secrets to version control
- Use environment variables for sensitive configuration
- Add `.orchestr8/docs/` to `.gitignore` to prevent sensitive reports from being committed
- Review generated documentation before committing to ensure no secrets are exposed
- Be aware that the knowledge database (`.orchestr8/intelligence.db`) may contain sensitive information

### 4. Secure Your Environment

- Use strong authentication for your development machine
- Keep your operating system and dependencies updated
- Use full-disk encryption on development machines
- Implement proper access controls on your projects
- Be cautious when running orchestr8 on shared systems

### 5. Validate Generated Code

orchestr8 generates code through AI agents. Always:

- Review generated code before deploying to production
- Run security scans on generated code (use `/orchestr8:security-audit`)
- Test generated code thoroughly
- Validate that security best practices are followed
- Check for injection vulnerabilities in generated code

### 6. Limit Permissions

- Run orchestr8 with the minimum required permissions
- Avoid running as root or with elevated privileges
- Use separate credentials for development vs. production
- Implement principle of least privilege

### 7. Monitor for Suspicious Activity

- Review agent execution logs regularly
- Monitor file system changes in your projects
- Check for unexpected network connections
- Be alert to unusual agent behavior

## Security Update Process

When a security vulnerability is confirmed, we follow this process:

### 1. Development Phase

- Develop a fix in a private branch
- Test the fix thoroughly
- Prepare security advisory
- Determine affected versions

### 2. Release Phase

- Create a patch release with the security fix
- Publish security advisory (GitHub Security Advisory)
- Update CHANGELOG with security fix details
- Notify users through multiple channels

### 3. Post-Release Phase

- Monitor for additional reports of the same issue
- Update documentation with security lessons learned
- Consider additional hardening measures
- Coordinate CVE assignment for critical vulnerabilities

## Security Audits

orchestr8 includes a built-in security audit capability:

```bash
/orchestr8:security-audit
```

This workflow performs:

- Dependency vulnerability scanning (npm, pip, cargo, etc.)
- Static application security testing (SAST)
- Secrets detection (hardcoded credentials, API keys)
- OWASP Top 10 manual review
- Compliance validation (SOC2, GDPR, HIPAA, PCI-DSS)
- Automated remediation of safe fixes

We recommend running security audits:

- Before every production deployment
- After adding new dependencies
- Quarterly for active projects
- After any significant code changes

## Compliance and Standards

orchestr8 follows industry security standards and compliance frameworks:

### OWASP Compliance

orchestr8's security practices align with:

- **OWASP Top 10 (2021)**: All 10 categories covered in security audits
- **OWASP ASVS (Application Security Verification Standard)**: Level 2 baseline
- **OWASP SAMM (Software Assurance Maturity Model)**: Security in SDLC

The built-in security auditor agent includes comprehensive OWASP Top 10 checks:

1. **A01:2021 - Broken Access Control**: Authentication, authorization, IDOR prevention
2. **A02:2021 - Cryptographic Failures**: Encryption, TLS, password hashing, key management
3. **A03:2021 - Injection**: SQL, command, NoSQL, LDAP injection prevention
4. **A04:2021 - Insecure Design**: Threat modeling, secure design patterns
5. **A05:2021 - Security Misconfiguration**: Headers, CORS, error handling
6. **A06:2021 - Vulnerable Components**: Dependency scanning, updates
7. **A07:2021 - Authentication Failures**: Password policy, MFA, session management
8. **A08:2021 - Software/Data Integrity**: Code signing, CI/CD security
9. **A09:2021 - Logging/Monitoring**: Security event logging, incident response
10. **A10:2021 - SSRF**: URL validation, domain whitelisting

### Compliance Frameworks

orchestr8 includes specialized agents for compliance validation:

- **SOC 2 Type II**: Controls, logging, access management
- **GDPR**: Data protection, privacy by design, right to erasure
- **HIPAA**: PHI encryption, access controls, audit trails
- **PCI-DSS**: Payment card data security
- **ISO 27001**: Information security management
- **FedRAMP**: Federal cloud security requirements

### Secure Development Lifecycle

orchestr8 implements security throughout the development lifecycle:

- **Requirements Phase**: Security requirements defined, threat modeling
- **Design Phase**: Security architecture review, secure design patterns
- **Implementation Phase**: Secure coding practices, code review
- **Testing Phase**: Security testing, penetration testing
- **Deployment Phase**: Security validation, deployment checks
- **Operations Phase**: Monitoring, incident response, updates

## Hall of Fame

We recognize security researchers who have helped improve orchestr8's security:

*(To be populated with contributors who responsibly disclose vulnerabilities)*

---

**Thank you for helping keep orchestr8 and the community safe!**

If you have any questions about this security policy, please start a discussion in [GitHub Discussions](https://github.com/seth-schultz/orchestr8/discussions).

## Additional Resources

- **Main Repository**: https://github.com/seth-schultz/orchestr8
- **Documentation**: [README.md](README.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **Security Auditor Agent**: [plugins/orchestr8/agents/quality/security-auditor.md](plugins/orchestr8/agents/quality/security-auditor.md)
- **Security Audit Workflow**: [plugins/orchestr8/commands/security-audit.md](plugins/orchestr8/commands/security-audit.md)

---

**Last Updated**: 2025-01-15
**Version**: 6.1.0
