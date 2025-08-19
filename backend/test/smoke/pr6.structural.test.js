const fs = require('fs');

test('ui config handler exists and exposes dashboards', () => {
  expect(fs.existsSync('../src/backend/services/uiConfig.js')).toBe(true);
  const s = fs.readFileSync('../src/backend/services/uiConfig.js', 'utf8');
  expect(s.includes('getUiConfig')).toBe(true);
  expect(s.includes('dashboards')).toBe(true);
});