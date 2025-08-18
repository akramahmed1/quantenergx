# Security Tooling Prerequisites and Guarded Execution

This repository includes optional security and performance tools that are valuable for a real-time energy trading platform, but they are guarded so that local developer environments or CI runs won't fail when tools aren't installed.

## Prerequisites

- k6 (optional, for load testing)
  - macOS: `brew install k6`
  - Windows: `choco install k6`
  - Linux: see https://k6.io/docs/get-started/installation/

- Python tooling (optional, for scanning any Python components/scripts)
  - Ensure Python 3.10+ is installed
  - `pip install bandit safety`
  - If present, Safety will use `requirements-dev.txt`

## Guarded Execution

- Package scripts call small Node wrappers that skip gracefully when tools aren't installed:
  - `scripts/run-k6.js` will run a provided k6 script if k6 is installed; otherwise it skips without failing.
  - `scripts/guarded-python-scans.js` will run `bandit` and/or `safety` when available, otherwise skip.

- Run all guarded checks from the repo root:
  ```bash
  npm run security:check
  ```

This will:
- Execute k6-only checks when k6 is installed and scripts are present
- Run Bandit/Safety only if Python files are detected (when using the shell variant) and the tools are installed

Any findings are printed but will not hard-fail the overall process unless you explicitly configure CI to do so.