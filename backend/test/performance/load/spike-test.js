import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Spike test configuration - sudden load spikes
export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Normal load
    { duration: '30s', target: 200 }, // Sudden spike
    { duration: '1m', target: 200 },  // Maintain spike
    { duration: '30s', target: 20 },  // Drop back to normal
    { duration: '2m', target: 20 },   // Normal load
    { duration: '30s', target: 300 }, // Bigger spike
    { duration: '1m', target: 300 },  // Maintain bigger spike
    { duration: '30s', target: 20 },  // Drop back to normal
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.2'], // Allow 20% error rate during spikes
    errors: ['rate<0.2'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

const testUser = {
  email: 'spike-test@quantenergx.com',
  password: 'TestPassword123!',
};

export function setup() {
  console.log('Setting up spike test...');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  
  // Simulate user behavior during traffic spikes
  
  // 1. Health check
  let response = http.get(`${baseUrl}/health`);
  check(response, {
    'health check responds during spike': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. Authentication
  response = http.post(`${baseUrl}/auth/login`, JSON.stringify(testUser), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const authSuccess = check(response, {
    'login handles spike traffic': (r) => r.status === 200 || r.status === 429,
  });
  
  if (response.status !== 200) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const token = response.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  sleep(0.3);

  // 3. Critical path operations during spike
  response = http.get(`${baseUrl}/market/prices?symbols=CRUDE_OIL`, { headers: authHeaders });
  check(response, {
    'market data available during spike': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.2);

  // 4. User data access
  response = http.get(`${baseUrl}/user/profile`, { headers: authHeaders });
  check(response, {
    'user profile accessible during spike': (r) => r.status < 500,
  }) || errorRate.add(1);

  sleep(0.5);
}

export function teardown(data) {
  console.log('Spike test completed');
}