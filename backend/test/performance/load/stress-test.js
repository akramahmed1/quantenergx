import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Stress test configuration - pushing beyond normal capacity
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp-up to 50 users
    { duration: '2m', target: 100 },  // Ramp-up to 100 users
    { duration: '3m', target: 200 },  // Ramp-up to 200 users (stress level)
    { duration: '5m', target: 200 },  // Stay at 200 users for 5 minutes
    { duration: '2m', target: 300 },  // Spike to 300 users
    { duration: '3m', target: 300 },  // Stay at 300 users
    { duration: '2m', target: 400 },  // Push to 400 users (beyond capacity)
    { duration: '3m', target: 400 },  // Stay at 400 users
    { duration: '5m', target: 0 },    // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete below 5s (relaxed for stress)
    http_req_failed: ['rate<0.3'], // Allow higher error rate during stress (30%)
    errors: ['rate<0.3'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

// Realistic test data pool
const testUsers = [
  { email: 'trader1@quantenergx.com', password: 'TestPassword123!' },
  { email: 'trader2@quantenergx.com', password: 'TestPassword123!' },
  { email: 'trader3@quantenergx.com', password: 'TestPassword123!' },
  { email: 'trader4@quantenergx.com', password: 'TestPassword123!' },
  { email: 'trader5@quantenergx.com', password: 'TestPassword123!' },
];

const tradingSymbols = ['CRUDE_OIL', 'NATURAL_GAS', 'BRENT_OIL', 'HEATING_OIL', 'GASOLINE'];

export function setup() {
  console.log('Setting up stress test...');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  const userId = Math.floor(Math.random() * testUsers.length);
  const testUser = testUsers[userId];
  
  // Aggressive test scenario with minimal sleep times
  
  // 1. Quick health check
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    'health check available': (r) => r.status < 500,
  }) || errorRate.add(1);

  // 2. Concurrent authentication attempts
  response = http.post(`${baseUrl}/auth/login`, JSON.stringify(testUser), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const authSuccess = check(response, {
    'login successful or server handling load': (r) => r.status === 200 || r.status === 429,
    'login response time reasonable under stress': (r) => r.timings.duration < 10000,
  });
  
  if (response.status !== 200) {
    errorRate.add(1);
    sleep(Math.random() * 2); // Random backoff on failure
    return;
  }

  const token = response.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 3. Rapid-fire API calls to stress the system
  const symbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)];
  
  // Concurrent requests to different endpoints
  const requests = [
    ['GET', `${baseUrl}/user/profile`, null, authHeaders],
    ['GET', `${baseUrl}/trading/instruments`, null, authHeaders],
    ['GET', `${baseUrl}/market/prices?symbols=${symbol}`, null, authHeaders],
    ['GET', `${baseUrl}/trading/positions`, null, authHeaders],
    ['GET', `${baseUrl}/trading/orders`, null, authHeaders],
  ];

  const responses = http.batch(requests);
  
  responses.forEach((response, index) => {
    check(response, {
      [`batch request ${index} handled`]: (r) => r.status < 500,
      [`batch request ${index} response time reasonable`]: (r) => r.timings.duration < 8000,
    }) || errorRate.add(1);
  });

  // 4. Simulate trading activity under stress
  if (Math.random() > 0.3) { // 70% chance to place an order
    const orderData = {
      symbol: symbol,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      quantity: Math.floor(Math.random() * 1000) + 100,
      orderType: 'market',
    };

    response = http.post(`${baseUrl}/trading/orders`, JSON.stringify(orderData), {
      headers: authHeaders,
    });

    check(response, {
      'order placement handled under stress': (r) => r.status < 500,
    }) || errorRate.add(1);
  }

  // 5. Heavy data retrieval
  if (Math.random() > 0.5) { // 50% chance to get historical data
    response = http.get(`${baseUrl}/market/history/${symbol}?period=1d&limit=1000`, {
      headers: authHeaders,
    });

    check(response, {
      'historical data request handled': (r) => r.status < 500,
    }) || errorRate.add(1);
  }

  // Minimal sleep to maintain pressure
  sleep(0.1 + Math.random() * 0.5);
}

export function teardown(data) {
  console.log('Stress test completed');
  // Log final metrics or cleanup
}