# Dependency Upgrade Notes

This document tracks packages that cannot be upgraded to latest versions and explains why.

## Blocked Upgrades

### Artillery (Backend Performance Testing)
- **Current Version**: 2.0.23
- **Requirement**: Node.js >= 22.13.0
- **Our Node Version**: 20.19.4
- **Issue**: Artillery 2.x requires Node 22+ which is newer than our supported runtime
- **Solution**: Consider replacing with k6 or maintaining current version for now
- **Impact**: Low - only used for performance testing, not production runtime

### Bundlesize (Bundle Analysis)
- **Current Version**: 0.18.1  
- **Issue**: Depends on vulnerable axios versions (0.21.4)
- **Solution**: Consider replacing with @bundle-analyzer/rollup-plugin or webpack-bundle-analyzer
- **Impact**: Low - only used for build-time bundle analysis

### ESLint 8.x (Linting)
- **Current Version**: 8.57.1
- **Issue**: ESLint 8.x is no longer supported (EOL)
- **Solution**: Upgrade to ESLint 9.x (requires configuration migration)
- **Impact**: Medium - affects development workflow

## Security Vulnerabilities

### High Priority (Critical/High)
1. **axios** in bundlesize dependencies - CSRF and SSRF vulnerabilities
2. **form-data** in telegram bot dependencies - Unsafe random function
3. **tough-cookie** - Prototype pollution

### Medium Priority (Moderate)
1. **tough-cookie** - Prototype pollution in request dependencies

## Recommended Actions

### Immediate (Security Critical)
1. Replace or update `node-telegram-bot-api` to version 0.66.0+
2. Replace `bundlesize` with modern alternative
3. Consider removing `artillery` and using k6 for performance testing

### Future (Modernization)
1. Upgrade to ESLint 9.x with flat config
2. Upgrade Node.js to LTS version that supports artillery 2.x
3. Audit and update all other dependencies to latest stable versions

## Alternative Packages

### For Bundle Analysis
- **webpack-bundle-analyzer**: More modern, actively maintained
- **@bundle-analyzer/rollup-plugin**: Rollup-specific alternative
- **size-limit**: Performance-focused bundle size checking

### For Performance Testing  
- **k6**: Modern, cloud-native performance testing tool
- **autocannon**: Lightweight HTTP benchmarking tool
- **clinic.js**: Node.js performance profiling

### For Linting
- **ESLint 9.x**: Latest version with flat config
- **Biome**: Fast all-in-one linting and formatting tool