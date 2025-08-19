// Data Lake export utility (S3-first, local fallback)
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

let S3Client = null;
let PutObjectCommand = null;

try {
  // Lazy/optional dependency
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
} catch (_) {
  // SDK not installed; will fallback to local filesystem
}

const cfg = {
  bucket: process.env.DATA_LAKE_S3_BUCKET || '',
  prefix: process.env.DATA_LAKE_PREFIX || 'raw/',
  localDir: process.env.DATA_LAKE_LOCAL_DIR || path.join(process.cwd(), 'data_lake'),
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
};

let s3 = null;
if (S3Client && cfg.bucket) {
  try {
    s3 = new S3Client({ region: cfg.region });
  } catch (_) {
    s3 = null;
  }
}

async function ensureLocalDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

function toKey(relativePath) {
  const clean = relativePath.replace(/^\/+/, '');
  return cfg.prefix ? `${cfg.prefix}${clean}` : clean;
}

async function putJson(relativePath, data) {
  const body = Buffer.from(JSON.stringify(data, null, 2), 'utf8');
  const key = toKey(relativePath.endsWith('.json') ? relativePath : `${relativePath}.json`);
  if (s3 && PutObjectCommand) {
    await s3.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: 'application/json' }));
    return { target: 's3', bucket: cfg.bucket, key };
  }
  const filePath = path.join(cfg.localDir, key);
  await ensureLocalDir(path.dirname(filePath));
  await fsp.writeFile(filePath, body);
  return { target: 'local', path: filePath };
}

function toCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map((h) => JSON.stringify(r[h] ?? '')).join(','));
  }
  return lines.join('\n');
}

async function putCsv(relativePath, rows) {
  const body = Buffer.from(toCsv(rows), 'utf8');
  const key = toKey(relativePath.endsWith('.csv') ? relativePath : `${relativePath}.csv`);
  if (s3 && PutObjectCommand) {
    await s3.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: body, ContentType: 'text/csv' }));
    return { target: 's3', bucket: cfg.bucket, key };
  }
  const filePath = path.join(cfg.localDir, key);
  await ensureLocalDir(path.dirname(filePath));
  await fsp.writeFile(filePath, body);
  return { target: 'local', path: filePath };
}

module.exports = {
  putJson,
  putCsv,
  toCsv,
  config: { ...cfg, hasS3: Boolean(s3) },
};