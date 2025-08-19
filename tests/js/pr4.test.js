/* Structural checks for PR4 */
const fs = require('fs');

function mustContain(p, needle) {
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(needle)) {
    console.error(`Expected "${needle}" in ${p}`);
    process.exit(1);
  }
}

[
  'src/backend/services/complianceAlerts.js',
  'src/backend/services/complianceRules.json'
].forEach((p) => {
  if (!fs.existsSync(p)) {
    console.error(`Missing file ${p}`);
    process.exit(1);
  }
});

mustContain('src/backend/services/complianceAlerts.js', 'function evaluateOrder');
mustContain('src/backend/services/complianceRules.json', 'restricted_symbols');

console.log('PR4 structural checks passed');