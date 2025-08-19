// Compliance Alerts Engine (rules-driven, additive, no external deps)
const path = require('path');

let defaultRules = {
  large_order_threshold: 1_000_000, // notional, e.g., USD
  restricted_symbols: ['SANDBOX_EXAMPLE'],
  max_leverage: 10,
  regions_blocklist: [],
};

try {
  // Prefer colocated JSON rules if present
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const loaded = require(path.join(__dirname, 'complianceRules.json'));
  if (loaded && typeof loaded === 'object') {
    defaultRules = { ...defaultRules, ...loaded };
  }
} catch (_) {
  // Optional: rules file may not exist yet
}

function buildAlert(code, severity, message, context = {}) {
  return { code, severity, message, context, ts: Date.now() };
}

// order: { symbol, side, quantity, price, leverage?, region?, userId? }
function evaluateOrder(order, rules = defaultRules) {
  const alerts = [];

  const qty = Number(order?.quantity || 0);
  const px = Number(order?.price || 0);
  const notional = qty * px;

  if (Number.isFinite(notional) && rules.large_order_threshold && notional > rules.large_order_threshold) {
    alerts.push(
      buildAlert(
        'COMPL_LARGE_ORDER',
        'warning',
        `Order notional ${notional} exceeds threshold ${rules.large_order_threshold}`,
        { notional, threshold: rules.large_order_threshold }
      )
    );
  }

  const sym = String(order?.symbol || '').toUpperCase();
  if (sym && Array.isArray(rules.restricted_symbols) && rules.restricted_symbols.map(String).map(s => s.toUpperCase()).includes(sym)) {
    alerts.push(buildAlert('COMPL_RESTRICTED_SYMBOL', 'error', `Symbol ${sym} is restricted`, { symbol: sym }));
  }

  const lev = Number(order?.leverage || 1);
  if (Number.isFinite(lev) && rules.max_leverage && lev > rules.max_leverage) {
    alerts.push(
      buildAlert(
        'COMPL_EXCESS_LEVERAGE',
        'error',
        `Requested leverage ${lev} exceeds max ${rules.max_leverage}`,
        { leverage: lev, max: rules.max_leverage }
      )
    );
  }

  const reg = String(order?.region || '').toUpperCase();
  if (reg && Array.isArray(rules.regions_blocklist) && rules.regions_blocklist.map(String).map(s => s.toUpperCase()).includes(reg)) {
    alerts.push(buildAlert('COMPL_BLOCKED_REGION', 'error', `Region ${reg} blocked`, { region: reg }));
  }

  return alerts;
}

function getRules() {
  return { ...defaultRules };
}

function setRules(nextRules = {}) {
  if (!nextRules || typeof nextRules !== 'object') return;
  defaultRules = { ...defaultRules, ...nextRules };
}

module.exports = {
  evaluateOrder,
  getRules,
  setRules,
  defaultRules,
};