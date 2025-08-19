# Dynamic UI Guide

This provides a backend-generated UI configuration JSON. The shape is stable and can be queried by frontend clients.

## Path
- `src/backend/services/uiConfig.js`

## Usage
- Mount into your Express app as needed:
  ```js
  const express = require('express');
  const { getUiConfig } = require('../../src/backend/services/uiConfig');
  const app = express();
  app.get('/api/ui/config', getUiConfig);
  ```
- The response contains:
  - `version`: schema version
  - `theme`: theme preference
  - `dashboards`: list of dashboards and widgets

## Frontend Integration
- Fetch `/api/ui/config` at startup to construct dashboards dynamically.
- Poll or subscribe to changes if you add a push mechanism later.