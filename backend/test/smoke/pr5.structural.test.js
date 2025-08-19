const fs = require('fs');

test('data lake module exists and contains expected symbols', () => {
  expect(fs.existsSync('../src/backend/services/dataLake.js')).toBe(true);
  const s = fs.readFileSync('../src/backend/services/dataLake.js', 'utf8');
  expect(s.includes('PutObjectCommand')).toBe(true);
  expect(s.includes('function putJson')).toBe(true);
});