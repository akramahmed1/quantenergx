# Compliance Alerts

This module provides a lightweight, rules-driven compliance alert engine for orders.

## Files
- `src/backend/services/complianceAlerts.js`: Rule evaluation helpers
- `src/backend/services/complianceRules.json`: Default ruleset (override as needed)

## Usage
- Evaluate an order object:
  ```js
  const { evaluateOrder } = require('../../src/backend/services/complianceAlerts');
  const alerts = evaluateOrder({ symbol: 'EUA_TEST', quantity: 1000, price: 200, leverage: 12, region: 'US' });
  // alerts: array of { code, severity, message, context, ts }
  ```

## Rules
- large_order_threshold (number)
- restricted_symbols (array)
- max_leverage (number)
- regions_blocklist (array)

## Integration Notes
- Wire this engine to trading and order placement flows.
- Forward alerts to logs, dashboards, or messaging (Kafka/EventBridge) as needed.