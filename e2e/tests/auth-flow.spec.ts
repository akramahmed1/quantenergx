import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const BASE_URL = 'http://localhost:3000';
  const API_URL = 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should redirect unauthenticated users to login page', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Should redirect to login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    
    // Should show login form
    await expect(page.getByRole('heading', { name: 'QuantEnergx' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Energy Trading Platform' })).toBeVisible();
    await expect(page.getByLabelText('Username')).toBeVisible();
    await expect(page.getByLabelText('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('should successfully login with admin credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click on demo credentials
    await page.getByRole('link', { name: 'View Demo Credentials' }).click();
    
    // Click on admin credentials to auto-fill
    await page.getByText('AdministratorUsername: admin').click();
    
    // Verify credentials are filled
    await expect(page.getByLabelText('Username')).toHaveValue('admin');
    await expect(page.getByLabelText('Password')).toHaveValue('Admin!2025Demo');
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(BASE_URL + '/');
    
    // Should show dashboard content
    await expect(page.getByRole('heading', { name: 'QuantEnergx Dashboard' })).toBeVisible();
    
    // Should show sidebar navigation
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trading' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Risk Management' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compliance' })).toBeVisible();
    
    // Should show logout button
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should successfully login with trader credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Click on demo credentials
    await page.getByRole('link', { name: 'View Demo Credentials' }).click();
    
    // Click on trader credentials
    await page.getByText('TraderUsername: trader1').click();
    
    // Verify credentials are filled
    await expect(page.getByLabelText('Username')).toHaveValue('trader1');
    await expect(page.getByLabelText('Password')).toHaveValue('Trader!2025Demo');
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(BASE_URL + '/');
    await expect(page.getByRole('heading', { name: 'QuantEnergx Dashboard' })).toBeVisible();
  });

  test('should navigate between protected pages after login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('link', { name: 'View Demo Credentials' }).click();
    await page.getByText('AdministratorUsername: admin').click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(BASE_URL + '/');
    
    // Navigate to Trading
    await page.getByRole('button', { name: 'Trading' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/trading`);
    await expect(page.getByRole('heading', { name: 'Trading Dashboard' })).toBeVisible();
    
    // Navigate to Risk Management
    await page.getByRole('button', { name: 'Risk Management' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/risk`);
    
    // Navigate to Compliance
    await page.getByRole('button', { name: 'Compliance' }).click();
    await expect(page).toHaveURL(`${BASE_URL}/compliance`);
    
    // Navigate back to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(BASE_URL + '/');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Enter invalid credentials
    await page.getByLabelText('Username').fill('invalid');
    await page.getByLabelText('Password').fill('wrongpassword');
    
    // Submit the form
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('link', { name: 'View Demo Credentials' }).click();
    await page.getByText('AdministratorUsername: admin').click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Verify we're logged in
    await expect(page).toHaveURL(BASE_URL + '/');
    
    // Click logout
    await page.getByRole('button', { name: 'Logout' }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    
    // Should not be able to access protected routes
    await page.goto(BASE_URL + '/trading');
    await expect(page).toHaveURL(`${BASE_URL}/login`);
  });

  test('should preserve redirect after login', async ({ page }) => {
    // Try to access protected route directly
    await page.goto(`${BASE_URL}/trading`);
    
    // Should redirect to login
    await expect(page).toHaveURL(`${BASE_URL}/login`);
    
    // Login
    await page.getByRole('link', { name: 'View Demo Credentials' }).click();
    await page.getByText('AdministratorUsername: admin').click();
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should redirect back to original destination
    await expect(page).toHaveURL(`${BASE_URL}/trading`);
  });

  test('should validate backend API is working', async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get(`${API_URL}/health`);
    expect(healthResponse.ok()).toBeTruthy();
    
    const healthData = await healthResponse.json();
    expect(healthData.success).toBe(true);
    expect(healthData.data.status).toBe('healthy');
    
    // Test login API
    const loginResponse = await request.post(`${API_URL}/api/v1/users/auth/login`, {
      data: {
        username: 'admin',
        password: 'Admin!2025Demo'
      }
    });
    
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.token).toBeDefined();
    expect(loginData.user.username).toBe('admin');
  });
});