// CSV import/tax calc
const csv = require('csv-parser');
const fs = require('fs');
function importCSV(filePath, cb) {
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => cb(results));
}
function taxCalc(trades) {
  return trades.reduce((acc, t) => acc + (t.profit || 0) * 0.2, 0);
}
module.exports = { importCSV, taxCalc };
