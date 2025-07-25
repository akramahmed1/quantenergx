---
name: Pull Request
about: Submit a pull request to contribute to QuantEnergx
title: "[FEATURE/BUGFIX/SECURITY] Brief description"
labels: needs-review
assignees: ''
---

## 📋 Description

### Summary
Brief description of what this PR does and why it's needed.

### Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration change
- [ ] 🔒 Security enhancement
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvement
- [ ] 🧪 Test addition/modification

### Related Issues
Fixes #(issue_number) or Closes #(issue_number)

## 🔒 Security Checklist

### Authentication & Authorization
- [ ] All new endpoints have proper authentication
- [ ] Role-based access control is properly implemented
- [ ] JWT tokens are validated on all protected routes
- [ ] Session management follows security best practices
- [ ] MFA requirements are maintained where applicable

### Input Validation & Sanitization
- [ ] All user inputs are validated (frontend and backend)
- [ ] Input sanitization is applied consistently
- [ ] SQL injection prevention measures are in place
- [ ] XSS prevention measures are implemented
- [ ] CSRF protection is maintained
- [ ] File upload restrictions are enforced

### Data Protection
- [ ] Sensitive data is encrypted at rest and in transit
- [ ] Password hashing uses Argon2 or bcrypt with proper rounds
- [ ] API keys and secrets are server-side only
- [ ] Database queries use parameterized statements
- [ ] Row Level Security (RLS) policies are maintained
- [ ] Personal data handling complies with privacy requirements

### Security Headers & Configuration
- [ ] HTTPS/TLS enforcement is maintained
- [ ] Security headers are properly configured
- [ ] Rate limiting is applied to sensitive endpoints
- [ ] CORS settings are restrictive and appropriate
- [ ] Content Security Policy (CSP) is maintained

### Error Handling & Logging
- [ ] Error messages don't leak sensitive information
- [ ] All security events are logged appropriately
- [ ] Failed authentication attempts are monitored
- [ ] Audit trails are maintained for sensitive operations
- [ ] Log data doesn't contain secrets or PII

### Dependencies & Third-Party
- [ ] No new vulnerable dependencies introduced
- [ ] All dependencies are up-to-date
- [ ] Third-party integrations are secure
- [ ] API keys for external services are properly managed

## 🧪 Testing Checklist

### Unit Tests
- [ ] Unit tests added/updated for new functionality
- [ ] All existing unit tests pass
- [ ] Test coverage meets project standards (>80%)
- [ ] Edge cases and error conditions are tested

### Integration Tests
- [ ] Integration tests added/updated
- [ ] API endpoints tested with various inputs
- [ ] Database interactions tested
- [ ] External service integrations tested

### Security Tests
- [ ] Authentication/authorization tests updated
- [ ] Input validation tests added
- [ ] Rate limiting tests pass
- [ ] Security regression tests updated
- [ ] Penetration testing considerations documented

### Performance Tests
- [ ] Performance impact assessed
- [ ] Load testing performed if applicable
- [ ] Database query performance evaluated
- [ ] Memory usage considered

## 🚀 Deployment Considerations

### Database Changes
- [ ] Database migrations are included
- [ ] RLS policies are updated if needed
- [ ] Backward compatibility maintained
- [ ] Migration rollback plan exists

### Configuration
- [ ] Environment variables documented
- [ ] Configuration changes are documented
- [ ] Default values are secure
- [ ] Secrets management updated if needed

### Monitoring & Alerting
- [ ] New metrics/alerts added if applicable
- [ ] Log messages are appropriate
- [ ] Health check endpoints updated
- [ ] Performance monitoring considered

## 📖 Documentation

### Code Documentation
- [ ] Code is properly commented
- [ ] JSDoc comments added for new functions
- [ ] Complex logic is explained
- [ ] Security considerations documented

### API Documentation
- [ ] API endpoints documented
- [ ] Request/response examples provided
- [ ] Authentication requirements documented
- [ ] Rate limiting information included

### User Documentation
- [ ] User-facing changes documented
- [ ] Installation instructions updated
- [ ] Configuration guide updated
- [ ] Troubleshooting guide updated

## 🔍 Code Quality

### Code Style
- [ ] Code follows project style guidelines
- [ ] ESLint security rules pass
- [ ] No hardcoded secrets or sensitive data
- [ ] Consistent naming conventions used

### Architecture
- [ ] Code follows established patterns
- [ ] Separation of concerns maintained
- [ ] Dependencies are appropriate
- [ ] Performance considerations addressed

### Maintainability
- [ ] Code is readable and self-documenting
- [ ] Functions have single responsibility
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate and helpful

## 📸 Screenshots/Demo

If applicable, add screenshots or describe how to test the changes:

### Before
<!-- Screenshot or description of current behavior -->

### After
<!-- Screenshot or description of new behavior -->

### Testing Steps
1. Step 1
2. Step 2
3. Step 3

## 🧾 Additional Information

### Breaking Changes
If this is a breaking change, describe:
- What breaks
- Migration path for users
- Timeline for deprecation

### Performance Impact
- [ ] No performance impact
- [ ] Minor performance improvement
- [ ] Significant performance improvement
- [ ] Minor performance regression (justified)
- [ ] Performance impact unknown/needs testing

### Security Impact
- [ ] No security impact
- [ ] Improves security posture
- [ ] Maintains current security level
- [ ] Potential security implications (documented)

## ✅ Final Checklist

### Pre-Submission
- [ ] All tests pass locally
- [ ] Code has been reviewed by the author
- [ ] Security checklist completed
- [ ] Documentation updated
- [ ] PR description is complete

### CI/CD
- [ ] All CI checks pass
- [ ] Security scans pass
- [ ] Test coverage acceptable
- [ ] No new vulnerabilities introduced

### Review Process
- [ ] Ready for code review
- [ ] Security review completed (if applicable)
- [ ] Architecture review completed (if applicable)
- [ ] Product review completed (if applicable)

## 👥 Reviewers

### Required Reviews
- [ ] Code review by peer developer
- [ ] Security review (for security-related changes)
- [ ] Architecture review (for significant changes)
- [ ] Product review (for user-facing changes)

### Suggested Reviewers
@mention specific team members or stakeholders

## 📝 Notes for Reviewers

<!-- Any specific areas you'd like reviewers to focus on -->

---

**By submitting this PR, I confirm that:**
- [ ] I have read and followed the contributing guidelines
- [ ] I have completed the security checklist
- [ ] I have tested the changes thoroughly
- [ ] I understand the security implications of my changes
- [ ] I have not introduced any secrets or sensitive data in the code