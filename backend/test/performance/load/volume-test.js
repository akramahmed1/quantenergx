import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Volume test configuration - large data operations
export const options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp-up gradually
    { duration: '15m', target: 50 },  // Sustain load for volume testing
    { duration: '5m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // Allow longer response times for large data
    http_req_failed: ['rate<0.05'], // Lower error tolerance for volume tests
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api';

const testUser = {
  email: 'volume-test@quantenergx.com',
  password: 'TestPassword123!',
};

export function setup() {
  console.log('Setting up volume test...');
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  
  // Volume test scenario - large data operations
  
  // 1. Authentication
  let response = http.post(`${baseUrl}/auth/login`, JSON.stringify(testUser), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const authSuccess = check(response, {
    'login successful for volume test': (r) => r.status === 200,
  });
  
  if (!authSuccess) {
    errorRate.add(1);
    return;
  }

  const token = response.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  sleep(2);

  // 2. Large dataset retrieval - Historical data
  response = http.get(`${baseUrl}/market/history/CRUDE_OIL?period=1y&granularity=1h`, {
    headers: authHeaders,
  });
  
  check(response, {
    'large historical data retrieval successful': (r) => r.status === 200,
    'large dataset response time acceptable': (r) => r.timings.duration < 15000,
    'large dataset contains data': (r) => r.body.length > 1000,
  }) || errorRate.add(1);

  sleep(3);

  // 3. Bulk trading instruments data
  response = http.get(`${baseUrl}/trading/instruments?includeDetails=true&limit=1000`, {
    headers: authHeaders,
  });
  
  check(response, {
    'bulk instruments data successful': (r) => r.status === 200,
    'bulk instruments response time acceptable': (r) => r.timings.duration < 8000,
  }) || errorRate.add(1);

  sleep(2);

  // 4. Large file upload simulation (if applicable)
  const largeDataPayload = JSON.stringify({
    data: Array(1000).fill(null).map((_, i) => ({
      id: i,
      timestamp: new Date().toISOString(),
      value: Math.random() * 1000,
      metadata: `Sample data point ${i} with additional information`,
    })),
  });

  response = http.post(`${baseUrl}/data/upload`, largeDataPayload, {
    headers: authHeaders,
  });
  
  check(response, {
    'large data upload handled': (r) => r.status < 500,
    'large upload response time reasonable': (r) => r.timings.duration < 20000,
  }) || errorRate.add(1);

  sleep(4);

  // 5. Complex query operations
  response = http.get(`${baseUrl}/analytics/reports?dateRange=6m&includeCharts=true&format=detailed`, {
    headers: authHeaders,
  });
  
  check(response, {
    'complex analytics query successful': (r) => r.status === 200,
    'complex query response time acceptable': (r) => r.timings.duration < 12000,
  }) || errorRate.add(1);

  sleep(5);

  // 6. Database-intensive operations
  response = http.get(`${baseUrl}/trading/history?limit=5000&includeDetails=true`, {
    headers: authHeaders,
  });
  
  check(response, {
    'database-intensive query successful': (r) => r.status === 200,
    'database query response time acceptable': (r) => r.timings.duration < 10000,
  }) || errorRate.add(1);

  sleep(3);
}

export function teardown(data) {
  console.log('Volume test completed');
}