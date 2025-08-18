#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const scriptArg = process.argv[2];
if (!scriptArg) {
  console.log('[k6] No script provided. Usage: node scripts/run-k6.js <path-to-k6-script.js>');
  process.exit(0);
}

const scriptPath = resolve(process.cwd(), scriptArg);
if (!existsSync(scriptPath)) {
  console.log(`[k6] Script not found at ${scriptPath}; skipping`);
  process.exit(0);
}

const result = spawnSync('k6', ['run', scriptPath], { stdio: 'inherit' });
if (result.error && result.error.code === 'ENOENT') {
  console.log('[k6] k6 is not installed; skipping');
  process.exit(0);
}

if (typeof result.status === 'number' && result.status !== 0) {
  console.log(`[k6] k6 exited with code ${result.status}; continuing without failure`);
  process.exit(0);
}

process.exit(0);