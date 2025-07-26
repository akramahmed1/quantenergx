---
name: Pull Request
about: Submit a pull request to contribute to QuantEnergx
title: "[FEATURE/BUGFIX/SECURITY] Brief description"
labels: needs-review
assignees: ''
---

## Pull Request Type
<!-- Please check the type of change your PR introduces: -->
- [ ] 🚀 Feature (new functionality)
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] 💥 Breaking change (would cause existing functionality to not work as expected)
- [ ] 🔧 Refactor (code changes that neither fix a bug nor add a feature)
- [ ] 📚 Documentation update
- [ ] 🛠️ Infrastructure/CI changes
- [ ] 🔒 Security fix
- [ ] ⚡ Performance improvement

## Description
<!-- Provide a brief description of the changes -->

## Related Issues
<!-- Link to related issues using "Fixes #123" or "Closes #123" -->
- Fixes #
- Related to #

## Changes Made
<!-- List the main changes in this PR -->
- 
- 
- 

## Code Quality Checklist

### Automated Checks
- [ ] All CI/CD checks are passing
- [ ] No new linting errors introduced
- [ ] Code formatted with Prettier/Black
- [ ] Type checking passes (TypeScript/MyPy)
- [ ] All tests are passing
- [ ] Code coverage maintained or improved
- [ ] Security scans pass (no new vulnerabilities)
- [ ] Dependency audit passes

### Manual Review
- [ ] Code follows project conventions and style guide
- [ ] Functions are focused and reasonably sized (< 50 lines)
- [ ] Meaningful variable and function names used
- [ ] Adequate error handling implemented
- [ ] No hardcoded secrets or sensitive data
- [ ] Comments explain complex business logic

### Security Review
- [ ] Input validation implemented for user inputs
- [ ] SQL injection prevention measures in place
- [ ] XSS prevention implemented
- [ ] Authentication and authorization properly handled
- [ ] Secure communication protocols used
- [ ] Rate limiting applied where appropriate
- [ ] No secrets exposed in logs or error messages

### Testing
- [ ] Unit tests added/updated for new functionality
- [ ] Integration tests cover external dependencies
- [ ] E2E tests added for critical user flows
- [ ] Edge cases and error scenarios tested
- [ ] Performance tests added for critical paths

### Energy Trading Specific (if applicable)
- [ ] Position limits properly enforced
- [ ] Market data validation implemented
- [ ] Settlement calculations verified
- [ ] Compliance requirements met (FERC, etc.)
- [ ] Grid integration considerations addressed
- [ ] Real-time data handling optimized

### Documentation
- [ ] API documentation updated
- [ ] README files reflect changes
- [ ] Architecture decisions documented
- [ ] Breaking changes highlighted in changelog
- [ ] Migration guides provided if needed

## Performance Impact
<!-- Describe any performance implications -->
- [ ] No performance impact
- [ ] Minimal performance impact (< 5% change)
- [ ] Significant performance improvement
- [ ] Performance testing completed

## Breaking Changes
<!-- List any breaking changes -->
- None
- 

## Testing Instructions
<!-- Provide step-by-step instructions for testing -->
1. 
2. 
3. 

## Screenshots/Recordings
<!-- Add screenshots or recordings for UI changes -->

## AI Review Integration
<!-- Check if you've used AI tools for review -->
- [ ] Code reviewed with GitHub Copilot
- [ ] Architecture validated with AI assistance
- [ ] Security analysis completed with AI tools
- [ ] Performance suggestions reviewed

## Deployment Notes
<!-- Any special deployment considerations -->
- [ ] Database migrations required
- [ ] Configuration changes needed
- [ ] Environment variables added/modified
- [ ] Third-party service updates required
- [ ] Monitoring/alerting updates needed

## Post-Merge Tasks
<!-- Tasks to complete after merging -->
- [ ] Update documentation website
- [ ] Notify stakeholders of changes
- [ ] Monitor metrics and alerts
- [ ] Schedule follow-up reviews

---

### Review Requirements
<!-- Do not modify this section -->
**Standard Changes**: 1 approval from team member + all automated checks passing
**High-Risk Changes**: 2 approvals (1 senior) + security review + all checks passing
**Emergency Fixes**: 1 approval allowed with post-merge review required

### Review Focus Areas
Please reviewers focus on:
- [ ] Security implications
- [ ] Performance impact
- [ ] Code maintainability
- [ ] Business logic correctness
- [ ] Error handling completeness

---

**Author Checklist** (complete before requesting review):
- [ ] Self-reviewed the code changes
- [ ] Tested changes locally
- [ ] All automated checks passing
- [ ] Documentation updated
- [ ] Ready for production deployment