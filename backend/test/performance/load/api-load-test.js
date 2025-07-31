import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp-up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp-up to 50 users over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp-down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    errors: ['rate<0.1'], // Custom error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

// Test data
const testUser = {
  email: 'test@quantenergx.com',
  password: 'TestPassword123!',
};

export function setup() {
  // Setup: Create test user if needed
  console.log('Setting up load test...');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  
  // Test scenario: User authentication and basic API operations
  
  // 1. Health check
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // 2. User authentication
  response = http.post(`${baseUrl}/auth/login`, JSON.stringify(testUser), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const authSuccess = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 2s': (r) => r.timings.duration < 2000,
    'login returns token': (r) => r.json('token') !== undefined,
  });
  
  if (!authSuccess) {
    errorRate.add(1);
    return; // Skip rest of scenario if login fails
  }

  const token = response.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  sleep(1);

  // 3. Get user profile
  response = http.get(`${baseUrl}/user/profile`, { headers: authHeaders });
  check(response, {
    'profile fetch status is 200': (r) => r.status === 200,
    'profile fetch response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // 4. Get trading data
  response = http.get(`${baseUrl}/trading/instruments`, { headers: authHeaders });
  check(response, {
    'instruments fetch status is 200': (r) => r.status === 200,
    'instruments fetch response time < 1.5s': (r) => r.timings.duration < 1500,
    'instruments data is array': (r) => Array.isArray(r.json()),
  }) || errorRate.add(1);

  sleep(1);

  // 5. Get market data
  response = http.get(`${baseUrl}/market/prices?symbols=CRUDE_OIL,NATURAL_GAS`, { headers: authHeaders });
  check(response, {
    'market data fetch status is 200': (r) => r.status === 200,
    'market data fetch response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(2);

  // 6. WebSocket connection simulation (if applicable)
  // Note: k6 has limited WebSocket support, this is a placeholder for HTTP-based real-time endpoint
  response = http.get(`${baseUrl}/realtime/status`, { headers: authHeaders });
  check(response, {
    'realtime status check is 200': (r) => r.status === 200,
    'realtime status response time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(3);
}

export function teardown(data) {
  console.log('Load test completed');
  // Cleanup if needed
}