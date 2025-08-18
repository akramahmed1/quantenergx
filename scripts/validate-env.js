#!/usr/bin/env node
// Non-failing environment validator stub used by backend prebuild/prestart.
// It warns if a .env file is missing for the given workspace but does not exit non-zero.

const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const target = process.argv[2] || '';
const root = resolve(__dirname, '..');
const envPath = resolve(root, target ? `${target}/.env` : '.env');

if (!existsSync(envPath)) {
  console.log(`[env] Warning: No .env file found at ${envPath}. Continuing...`);
} else {
  console.log(`[env] Found environment file at ${envPath}.`);
}
