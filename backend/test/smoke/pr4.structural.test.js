const fs = require('fs');

function mustContain(p, needle) {
  const s = fs.readFileSync(p, 'utf8');
  expect(s.includes(needle)).toBe(true);
}

test('compliance engine files exist and contain key symbols', () => {
  expect(fs.existsSync('../src/backend/services/complianceAlerts.js')).toBe(true);
  expect(fs.existsSync('../src/backend/services/complianceRules.json')).toBe(true);
  mustContain('../src/backend/services/complianceAlerts.js', 'function evaluateOrder');
  mustContain('../src/backend/services/complianceAlerts.js', 'module.exports');
  mustContain('../src/backend/services/complianceRules.json', 'restricted_symbols');
});