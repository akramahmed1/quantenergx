const { esgScore } = require('../../src/backend/services/esg');

describe('esgScore', () => {
  it('returns a number', () => {
    expect(typeof esgScore({ environmental: 10, risk: 5 })).toBe('number');
  });
});
