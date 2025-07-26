# Branch Protection and Quality Gate Configuration

This document outlines the branch protection rules and quality gates that should be configured in GitHub repository settings.

## Branch Protection Rules

### Main Branch Protection
Configure the following rules for the `main` branch:

#### Required Status Checks
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging

**Required Checks:**
- `code-quality / Code Quality and Formatting`
- `security-analysis / Security Analysis`
- `static-analysis / Static Analysis`
- `backend-tests / Backend Tests`
- `frontend-tests / Frontend Tests`
- `quality-gate / Quality Gate`

#### Required Reviews
- [x] Require pull request reviews before merging
- [x] Required approving reviews: **2**
- [x] Dismiss stale reviews when new commits are pushed
- [x] Require review from code owners
- [x] Require approval from someone other than the last pusher

#### Restrictions
- [x] Restrict pushes that create files larger than 100 MB
- [x] Restrict force pushes
- [x] Restrict deletions

#### Additional Settings
- [x] Require signed commits
- [x] Require linear history
- [x] Include administrators in these restrictions

### Develop Branch Protection
Configure similar rules for the `develop` branch with slightly relaxed requirements:

- Required approving reviews: **1**
- Allow force pushes for admins
- Same status checks as main branch

## Quality Gate Configuration

### SonarQube Quality Gate
Configure the following conditions in SonarQube:

#### Coverage
- Coverage on New Code: >= 80%
- Coverage: >= 70%

#### Duplicated Lines
- Duplicated Lines on New Code: <= 3%

#### Maintainability
- Maintainability Rating on New Code: <= A
- Technical Debt Ratio on New Code: <= 5%

#### Reliability
- Reliability Rating on New Code: <= A
- Bugs on New Code: = 0

#### Security
- Security Rating on New Code: <= A
- Security Hotspots Reviewed: = 100%
- Vulnerabilities on New Code: = 0

### GitHub Repository Settings

#### General Settings
```yaml
repository:
  has_issues: true
  has_projects: true
  has_wiki: false
  has_downloads: false
  default_branch: main
  allow_squash_merge: true
  allow_merge_commit: false
  allow_rebase_merge: true
  delete_branch_on_merge: true
```

#### Security Settings
```yaml
security:
  dependency_alerts: true
  automated_security_fixes: true
  vulnerability_alerts: true
  secret_scanning: true
  code_scanning: true
```

#### Access Settings
```yaml
access:
  visibility: private
  collaborators:
    - admin: ['security-team', 'tech-leads']
    - maintain: ['senior-developers']
    - push: ['developers']
    - triage: ['qa-team']
    - pull: ['stakeholders']
```

## Enforcement Workflow

### Pre-merge Checklist
All PRs must pass:
1. ✅ Automated code quality checks
2. ✅ Security vulnerability scans
3. ✅ Unit and integration tests
4. ✅ E2E tests (for user-facing changes)
5. ✅ Code review approval(s)
6. ✅ SonarQube quality gate
7. ✅ No merge conflicts
8. ✅ Linear history maintenance

### Emergency Hotfix Process
For critical production issues:
1. Create hotfix branch from main
2. Implement minimal fix
3. Get single approval from tech lead
4. Deploy to staging for verification
5. Merge with post-deployment review scheduled

### Monitoring and Alerts
Set up alerts for:
- Failed quality gates
- Security vulnerabilities
- Coverage drops
- Performance degradation
- Dependency outdated alerts

## Implementation Script

Use this GitHub CLI script to configure branch protection:

```bash
#!/bin/bash
REPO="akramahmed1/quantenergx"

# Main branch protection
gh api repos/$REPO/branches/main/protection \
  --method PUT \
  --field required_status_checks='{
    "strict": true,
    "contexts": [
      "code-quality",
      "security-analysis", 
      "static-analysis",
      "backend-tests",
      "frontend-tests",
      "quality-gate"
    ]
  }' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{
    "required_approving_review_count": 2,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": true
  }' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Rollback Plan

If quality gates become blocking:
1. Temporarily adjust thresholds
2. Create exemption process for critical fixes
3. Schedule technical debt sprint
4. Gradually re-tighten requirements

## Continuous Improvement

### Monthly Reviews
- Analyze quality metrics trends
- Review exemptions and their reasons
- Adjust thresholds based on team maturity
- Update tooling and configurations

### Quarterly Assessments
- Survey developer experience
- Benchmark against industry standards
- Update security requirements
- Plan tooling upgrades