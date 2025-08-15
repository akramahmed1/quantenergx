const { runAIWorker } = require('../src/services/ai');
test('AI worker detects manipulation and calculates zakat', (done) => {
  runAIWorker({ profit: 1000 }, (result) => {
    expect(result).toHaveProperty('prediction');
    expect(result).toHaveProperty('zakat');
    expect(result.zakat).toBeCloseTo(25);
    done();
  });
});
