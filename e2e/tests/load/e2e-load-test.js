import http from 'k6/http';
import { browser } from 'k6/experimental/browser';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    browser_test: {
      executor: 'constant-vus',
      exec: 'browserTest',
      vus: 3,
      duration: '60s',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
    api_test: {
      executor: 'ramping-vus',
      exec: 'apiTest',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '60s', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    browser_web_vitals_fcp: ['p(95)<2000'],
    browser_web_vitals_lcp: ['p(95)<4000'],
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1'],
  },
};

export function browserTest() {
  const page = browser.newPage();
  
  try {
    // Navigate to login page
    page.goto('http://localhost:3000/login');
    
    // Wait for page to load
    page.waitForSelector('[data-testid="login-form"]');
    
    // Measure login performance
    const loginStart = Date.now();
    
    // Fill login form
    page.locator('[data-testid="login-email"]').type('test@quantenergx.com');
    page.locator('[data-testid="login-password"]').type('password123');
    page.locator('[data-testid="login-submit"]').click();
    
    // Wait for dashboard to load
    page.waitForSelector('[data-testid="dashboard-content"]');
    
    const loginEnd = Date.now();
    const loginDuration = loginEnd - loginStart;
    
    check(loginDuration, {
      'login completes within 3 seconds': (d) => d < 3000,
    });
    
    // Navigate to trading page
    const tradingStart = Date.now();
    page.locator('[data-testid="nav-trading"]').click();
    page.waitForSelector('[data-testid="trading-interface"]');
    
    const tradingEnd = Date.now();
    const tradingDuration = tradingEnd - tradingStart;
    
    check(tradingDuration, {
      'trading page loads within 2 seconds': (d) => d < 2000,
    });
    
    // Test order placement performance
    const orderStart = Date.now();
    
    page.locator('[data-testid="symbol-select"]').selectOption('CRUDE_OIL');
    page.locator('[data-testid="order-side-buy"]').click();
    page.locator('[data-testid="order-quantity"]').fill('100');
    page.locator('[data-testid="order-submit"]').click();
    
    // Wait for order confirmation
    page.waitForSelector('[data-testid="order-success"]');
    
    const orderEnd = Date.now();
    const orderDuration = orderEnd - orderStart;
    
    check(orderDuration, {
      'order placement completes within 1 second': (d) => d < 1000,
    });
    
    // Test market data updates
    const marketDataChecks = 5;
    for (let i = 0; i < marketDataChecks; i++) {
      const marketData = page.locator('[data-testid="market-price"]').textContent();
      check(marketData, {
        'market data is present': (data) => data && data.length > 0,
      });
      sleep(2);
    }
    
    // Test navigation performance
    const pages = [
      { nav: '[data-testid="nav-portfolio"]', content: '[data-testid="portfolio-content"]' },
      { nav: '[data-testid="nav-market"]', content: '[data-testid="market-content"]' },
      { nav: '[data-testid="nav-reports"]', content: '[data-testid="reports-content"]' },
    ];
    
    pages.forEach(({ nav, content }) => {
      const navStart = Date.now();
      page.locator(nav).click();
      page.waitForSelector(content);
      const navEnd = Date.now();
      
      check(navEnd - navStart, {
        'page navigation completes within 2 seconds': (d) => d < 2000,
      });
    });
    
  } finally {
    page.close();
  }
}

export function apiTest() {
  // Test API endpoints directly for performance
  const baseUrl = 'http://localhost:3001/api';
  
  // Login to get auth token
  const loginResponse = http.post(`${baseUrl}/auth/login`, JSON.stringify({
    email: 'test@quantenergx.com',
    password: 'password123'
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  check(loginResponse, {
    'login API responds within 500ms': (r) => r.timings.duration < 500,
    'login API returns 200': (r) => r.status === 200,
  });
  
  if (loginResponse.status !== 200) {
    return; // Skip rest if login fails
  }
  
  const token = loginResponse.json('token');
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Test critical API endpoints
  const endpoints = [
    { path: '/user/profile', threshold: 300 },
    { path: '/market/prices?symbols=CRUDE_OIL', threshold: 500 },
    { path: '/trading/instruments', threshold: 400 },
    { path: '/trading/positions', threshold: 600 },
    { path: '/market/history/CRUDE_OIL?period=1d', threshold: 1000 },
  ];
  
  endpoints.forEach(({ path, threshold }) => {
    const response = http.get(`${baseUrl}${path}`, { headers: authHeaders });
    
    check(response, {
      [`${path} responds within ${threshold}ms`]: (r) => r.timings.duration < threshold,
      [`${path} returns success`]: (r) => r.status >= 200 && r.status < 300,
      [`${path} returns valid JSON`]: (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
  });
  
  // Test order placement API performance
  const orderResponse = http.post(`${baseUrl}/trading/orders`, JSON.stringify({
    symbol: 'CRUDE_OIL',
    side: 'buy',
    quantity: 100,
    orderType: 'market'
  }), { headers: authHeaders });
  
  check(orderResponse, {
    'order API responds within 800ms': (r) => r.timings.duration < 800,
    'order API returns success': (r) => r.status >= 200 && r.status < 300,
  });
  
  // Test WebSocket connection (if available)
  // Note: k6 has limited WebSocket support
  const wsResponse = http.get(`${baseUrl}/realtime/status`, { headers: authHeaders });
  
  check(wsResponse, {
    'WebSocket status check responds quickly': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}

export function teardown() {
  console.log('E2E load test completed');
}