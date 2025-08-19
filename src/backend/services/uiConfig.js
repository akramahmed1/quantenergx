// Dynamic UI Configuration (Express-compatible handler, additive)
function getUiConfig(_req, res) {
  res.json({
    version: 'v1',
    theme: 'auto',
    dashboards: [
      {
        id: 'trading',
        title: 'Trading',
        layout: 'grid',
        widgets: [
          { type: 'orderBook', topic: 'market-data', refreshMs: 1000 },
          { type: 'positions', refreshMs: 2000 },
          { type: 'alerts', source: 'compliance', level: ['error', 'warning'] }
        ]
      },
      {
        id: 'risk',
        title: 'Risk',
        layout: 'grid',
        widgets: [
          { type: 'var', method: 'historical', horizon: '1D' },
          { type: 'stressTest', scenarios: ['+10%', '-10%'] }
        ]
      }
    ]
  });
}

module.exports = { getUiConfig };