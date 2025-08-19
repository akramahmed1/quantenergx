#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[security] Starting guarded security checks..."

# k6 load testing (optional)
if command -v k6 >/dev/null 2>&1; then
  DEFAULT_K6_SCRIPT="${ROOT_DIR}/k6/load.js"
  if [[ -f "${DEFAULT_K6_SCRIPT}" ]]; then
    echo "[security] Running k6 load test..."
    k6 run "${DEFAULT_K6_SCRIPT}" || echo "[security] k6 run completed with non-zero exit (continuing)"
  else
    echo "[security] No default k6 script found at '${DEFAULT_K6_SCRIPT}'; skipping"
  fi
else
  echo "[security] k6 not installed; skipping load testing"
fi

# Python security scanners (optional)
PY_FILES_FOUND="false"
if command -v find >/dev/null 2>&1; then
  if find "${ROOT_DIR}" -type f -name "*.py" -print -quit | grep -q .; then
    PY_FILES_FOUND="true"
  fi
fi

if [[ "${PY_FILES_FOUND}" == "true" ]]; then
  if command -v bandit >/dev/null 2>&1; then
    echo "[security] Running Bandit on Python sources..."
    bandit -q -r "${ROOT_DIR}" || echo "[security] Bandit completed with findings (continuing)"
  else
    echo "[security] Bandit not installed; skipping Python static analysis"
  fi

  if command -v safety >/dev/null 2>&1; then
    if [[ -f "${ROOT_DIR}/requirements-dev.txt" ]]; then
      echo "[security] Running Safety on requirements-dev.txt..."
      safety check -r "${ROOT_DIR}/requirements-dev.txt" || echo "[security] Safety reported vulnerabilities (continuing)"
    else
      echo "[security] requirements-dev.txt not found; skipping Safety"
    fi
  else
    echo "[security] Safety not installed; skipping dependency vulnerability scan"
  fi
else
  echo "[security] No Python files detected; skipping Bandit/Safety"
fi

echo "[security] Guarded security checks completed."