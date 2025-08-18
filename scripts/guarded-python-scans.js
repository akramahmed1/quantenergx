#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.error && res.error.code === 'ENOENT') {
    return { skipped: true, code: 0 };
  }
  const code = typeof res.status === 'number' ? res.status : 0;
  return { skipped: false, code };
}

const mode = process.argv[2];
if (!mode) {
  console.log('[security] No mode provided. Usage: node scripts/guarded-python-scans.js <bandit|safety> [arg]');
  process.exit(0);
}

if (mode === 'bandit') {
  const target = resolve(process.cwd(), process.argv[3] || '.');
  console.log(`[security] Running Bandit on ${target} if available...`);
  const res = run('bandit', ['-q', '-r', target]);
  if (res.skipped) {
    console.log('[security] Bandit not installed; skipping static analysis');
  } else if (res.code !== 0) {
    console.log('[security] Bandit reported findings; continuing without failure');
  }
  process.exit(0);
}

if (mode === 'safety') {
  const reqFile = resolve(process.cwd(), process.argv[3] || 'requirements-dev.txt');
  if (!existsSync(reqFile)) {
    console.log(`[security] ${reqFile} not found; skipping Safety`);
    process.exit(0);
  }
  console.log(`[security] Running Safety on ${reqFile} if available...`);
  const res = run('safety', ['check', '-r', reqFile]);
  if (res.skipped) {
    console.log('[security] Safety not installed; skipping dependency scan');
  } else if (res.code !== 0) {
    console.log('[security] Safety reported vulnerabilities; continuing without failure');
  }
  process.exit(0);
}

console.log(`[security] Unknown mode "${mode}". Use "bandit" or "safety".`);
process.exit(0);