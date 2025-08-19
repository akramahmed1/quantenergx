# Data Lake Export Guide

This utility writes analytics-ready data to S3 (preferred) or to a local directory fallback.

## Path
- `src/backend/services/dataLake.js`

## Env Vars
- `DATA_LAKE_S3_BUCKET` (required for S3 writes)
- `DATA_LAKE_PREFIX` (optional, default: `raw/`)
- `DATA_LAKE_LOCAL_DIR` (optional local fallback dir, default: `./data_lake`)
- `AWS_REGION` or `AWS_DEFAULT_REGION`

## Usage
```js
const { putJson, putCsv } = require('../../src/backend/services/dataLake');

await putJson('market/quotes/2025-08-19T22-20-52Z', { symbol: 'EUA', px: 93.12 });
await putCsv('trades/2025-08-19', [
  { id: 1, symbol: 'CL', qty: 10, price: 78.55 },
  { id: 2, symbol: 'EUA', qty: 50, price: 93.12 }
]);
```

If S3 SDK or configuration is unavailable, data is saved under `./data_lake`.