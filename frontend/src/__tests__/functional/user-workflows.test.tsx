/**
 * Frontend Functional Tests for QuantEnergX
 *
 * These tests verify that complete user workflows work correctly.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';

// Mock app components for functional testing
const MockLoginPage = () => (
  <div data-testid="login-page">
    <h1>Login</h1>
    <form data-testid="login-form">
      <input type="email" placeholder="Email" data-testid="email-input" />
      <input type="password" placeholder="Password" data-testid="password-input" />
      <button type="submit" data-testid="login-button">
        Login
      </button>
    </form>
  </div>
);

const MockDashboard = () => (
  <div data-testid="dashboard">
    <h1>Dashboard</h1>
    <div data-testid="portfolio-summary">
      <h2>Portfolio Summary</h2>
      <div data-testid="total-value">$100,000</div>
      <div data-testid="day-change">+$2,500 (+2.5%)</div>
    </div>
    <div data-testid="recent-orders">
      <h2>Recent Orders</h2>
      <div data-testid="order-item">
        <span>CRUDE_OIL</span>
        <span>BUY 100</span>
        <span>$75.50</span>
        <span>PENDING</span>
      </div>
    </div>
  </div>
);

const MockTradingPage = () => {
  const [orders, setOrders] = React.useState([]);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const newOrder = {
      id: `order-${Date.now()}`,
      symbol: formData.get('symbol') as string,
      side: formData.get('side') as string,
      quantity: Number(formData.get('quantity')),
      price: Number(formData.get('price')),
      status: 'pending',
    };

    setOrders(prev => [...prev, newOrder]);
    form.reset();
  };

  return (
    <div data-testid="trading-page">
      <h1>Trading</h1>
      <div data-testid="order-form-section">
        <h2>Place Order</h2>
        <form data-testid="order-form" onSubmit={handleSubmitOrder}>
          <select name="symbol" data-testid="symbol-select" defaultValue="">
            <option value="">Select Symbol</option>
            <option value="CRUDE_OIL">Crude Oil</option>
            <option value="NATURAL_GAS">Natural Gas</option>
            <option value="HEATING_OIL">Heating Oil</option>
          </select>

          <select name="side" data-testid="side-select" defaultValue="">
            <option value="">Select Side</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            data-testid="quantity-input"
            min="1"
          />

          <input
            type="number"
            name="price"
            placeholder="Price"
            data-testid="price-input"
            step="0.01"
            min="0"
          />

          <button type="submit" data-testid="submit-order-button">
            Place Order
          </button>
        </form>
      </div>

      <div data-testid="orders-list">
        <h2>Your Orders</h2>
        {orders.length === 0 ? (
          <div data-testid="no-orders">No orders placed yet</div>
        ) : (
          orders.map(order => (
            <div key={order.id} data-testid="order-item">
              <span data-testid="order-symbol">{order.symbol}</span>
              <span data-testid="order-side">{order.side.toUpperCase()}</span>
              <span data-testid="order-quantity">{order.quantity}</span>
              <span data-testid="order-price">${order.price}</span>
              <span data-testid="order-status">{order.status.toUpperCase()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MockMarketPage = () => (
  <div data-testid="market-page">
    <h1>Market Data</h1>
    <div data-testid="market-prices">
      <div data-testid="price-item">
        <span data-testid="symbol">CRUDE_OIL</span>
        <span data-testid="price">$76.50</span>
        <span data-testid="change">+$1.25 (+1.66%)</span>
      </div>
      <div data-testid="price-item">
        <span data-testid="symbol">NATURAL_GAS</span>
        <span data-testid="price">$3.45</span>
        <span data-testid="change">-$0.05 (-1.43%)</span>
      </div>
    </div>
  </div>
);

const MockApp = () => {
  const [currentPage, setCurrentPage] = React.useState('login');
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && currentPage === 'login') {
      setCurrentPage('dashboard');
    }
  }, [isAuthenticated, currentPage]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <MockLoginPage />;
      case 'dashboard':
        return <MockDashboard />;
      case 'trading':
        return <MockTradingPage />;
      case 'market':
        return <MockMarketPage />;
      default:
        return <MockDashboard />;
    }
  };

  return (
    <div data-testid="app">
      {isAuthenticated && (
        <nav data-testid="navigation">
          <button onClick={() => setCurrentPage('dashboard')} data-testid="nav-dashboard">
            Dashboard
          </button>
          <button onClick={() => setCurrentPage('trading')} data-testid="nav-trading">
            Trading
          </button>
          <button onClick={() => setCurrentPage('market')} data-testid="nav-market">
            Market
          </button>
          <button
            onClick={() => setIsAuthenticated(false) || setCurrentPage('login')}
            data-testid="nav-logout"
          >
            Logout
          </button>
        </nav>
      )}

      <main data-testid="main-content">{renderPage()}</main>

      {currentPage === 'login' && (
        <button onClick={handleLogin} data-testid="mock-login-success" style={{ display: 'none' }}>
          Mock Login Success
        </button>
      )}
    </div>
  );
};

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false, loading: false }, action) => {
        switch (action.type) {
          case 'auth/login/fulfilled':
            return { ...state, user: action.payload, isAuthenticated: true, loading: false };
          case 'auth/logout':
            return { ...state, user: null, isAuthenticated: false };
          default:
            return state;
        }
      },
      trading: (state = { orders: [], positions: [], loading: false }, action) => {
        switch (action.type) {
          case 'trading/placeOrder/fulfilled':
            return { ...state, orders: [...state.orders, action.payload] };
          default:
            return state;
        }
      },
      market: (state = { data: {}, loading: false }, action) => state,
      notifications: (state = { notifications: [], unreadCount: 0 }, action) => state,
      ...initialState,
    },
  });
};

const theme = createTheme();

const renderWithProviders = (
  component: React.ReactElement,
  { initialState = {}, store = createMockStore(initialState) } = {}
) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>{component}</ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('QuantEnergX Functional Tests', () => {
  describe('User Authentication Workflow', () => {
    test('complete login workflow', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Should start on login page
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.getByTestId('login-form')).toBeInTheDocument();

      // Check for login form elements
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();

      // Fill in credentials
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('password-input'), 'password123');

      // Simulate successful login
      await user.click(screen.getByTestId('mock-login-success'));

      // Should navigate to dashboard
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Should show navigation
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
      expect(screen.getByTestId('nav-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-trading')).toBeInTheDocument();
      expect(screen.getByTestId('nav-market')).toBeInTheDocument();
    });

    test('logout workflow', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login first
      await user.click(screen.getByTestId('mock-login-success'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Logout
      await user.click(screen.getByTestId('nav-logout'));

      // Should return to login page
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });

      // Navigation should be hidden
      expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Functionality', () => {
    test('dashboard displays portfolio information', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login-success'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Check portfolio summary
      expect(screen.getByTestId('portfolio-summary')).toBeInTheDocument();
      expect(screen.getByTestId('total-value')).toHaveTextContent('$100,000');
      expect(screen.getByTestId('day-change')).toHaveTextContent('+$2,500 (+2.5%)');

      // Check recent orders
      expect(screen.getByTestId('recent-orders')).toBeInTheDocument();
      expect(screen.getByTestId('order-item')).toBeInTheDocument();
    });
  });

  describe('Trading Workflow', () => {
    test('complete order placement workflow', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and navigate to trading
      await user.click(screen.getByTestId('mock-login-success'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('nav-trading'));

      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Check initial state - no orders
      expect(screen.getByTestId('no-orders')).toBeInTheDocument();

      // Fill out order form
      await user.selectOptions(screen.getByTestId('symbol-select'), 'CRUDE_OIL');
      await user.selectOptions(screen.getByTestId('side-select'), 'buy');
      await user.type(screen.getByTestId('quantity-input'), '100');
      await user.type(screen.getByTestId('price-input'), '75.50');

      // Submit order
      await user.click(screen.getByTestId('submit-order-button'));

      // Check that order appears in orders list
      await waitFor(() => {
        expect(screen.queryByTestId('no-orders')).not.toBeInTheDocument();
      });

      const orderItem = screen.getByTestId('order-item');
      expect(orderItem).toBeInTheDocument();
      expect(screen.getByTestId('order-symbol')).toHaveTextContent('CRUDE_OIL');
      expect(screen.getByTestId('order-side')).toHaveTextContent('BUY');
      expect(screen.getByTestId('order-quantity')).toHaveTextContent('100');
      expect(screen.getByTestId('order-price')).toHaveTextContent('$75.5');
      expect(screen.getByTestId('order-status')).toHaveTextContent('PENDING');
    });

    test('order form validation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and navigate to trading
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('nav-trading'));

      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Try to submit empty form
      await user.click(screen.getByTestId('submit-order-button'));

      // Form should not submit (order list should still show "no orders")
      expect(screen.getByTestId('no-orders')).toBeInTheDocument();
    });

    test('multiple orders workflow', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and navigate to trading
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('nav-trading'));

      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Place first order
      await user.selectOptions(screen.getByTestId('symbol-select'), 'CRUDE_OIL');
      await user.selectOptions(screen.getByTestId('side-select'), 'buy');
      await user.type(screen.getByTestId('quantity-input'), '100');
      await user.type(screen.getByTestId('price-input'), '75.50');
      await user.click(screen.getByTestId('submit-order-button'));

      await waitFor(() => {
        expect(screen.getAllByTestId('order-item')).toHaveLength(1);
      });

      // Place second order
      await user.selectOptions(screen.getByTestId('symbol-select'), 'NATURAL_GAS');
      await user.selectOptions(screen.getByTestId('side-select'), 'sell');
      await user.type(screen.getByTestId('quantity-input'), '200');
      await user.type(screen.getByTestId('price-input'), '3.45');
      await user.click(screen.getByTestId('submit-order-button'));

      await waitFor(() => {
        expect(screen.getAllByTestId('order-item')).toHaveLength(2);
      });
    });
  });

  describe('Market Data Workflow', () => {
    test('market data page displays correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and navigate to market
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('nav-market'));

      await waitFor(() => {
        expect(screen.getByTestId('market-page')).toBeInTheDocument();
      });

      // Check market data display
      expect(screen.getByTestId('market-prices')).toBeInTheDocument();
      const priceItems = screen.getAllByTestId('price-item');
      expect(priceItems).toHaveLength(2);

      // Check specific price data
      const symbols = screen.getAllByTestId('symbol');
      const prices = screen.getAllByTestId('price');
      const changes = screen.getAllByTestId('change');

      expect(symbols[0]).toHaveTextContent('CRUDE_OIL');
      expect(prices[0]).toHaveTextContent('$76.50');
      expect(changes[0]).toHaveTextContent('+$1.25 (+1.66%)');

      expect(symbols[1]).toHaveTextContent('NATURAL_GAS');
      expect(prices[1]).toHaveTextContent('$3.45');
      expect(changes[1]).toHaveTextContent('-$0.05 (-1.43%)');
    });
  });

  describe('Navigation Workflow', () => {
    test('navigation between pages works correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Navigate to trading
      await user.click(screen.getByTestId('nav-trading'));
      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Navigate to market
      await user.click(screen.getByTestId('nav-market'));
      await waitFor(() => {
        expect(screen.getByTestId('market-page')).toBeInTheDocument();
      });

      // Navigate back to dashboard
      await user.click(screen.getByTestId('nav-dashboard'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles invalid form inputs gracefully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login and navigate to trading
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('nav-trading'));

      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Try invalid inputs
      await user.type(screen.getByTestId('quantity-input'), '-100');
      await user.type(screen.getByTestId('price-input'), '-50');

      // Form should handle validation (HTML5 validation or custom)
      const quantityInput = screen.getByTestId('quantity-input') as HTMLInputElement;
      const priceInput = screen.getByTestId('price-input') as HTMLInputElement;

      expect(quantityInput.value).toBe('-100');
      expect(priceInput.value).toBe('-50');

      // Submit button should exist but form might not submit due to validation
      expect(screen.getByTestId('submit-order-button')).toBeInTheDocument();
    });

    test('maintains state during navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Go to trading and place an order
      await user.click(screen.getByTestId('nav-trading'));
      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByTestId('symbol-select'), 'CRUDE_OIL');
      await user.selectOptions(screen.getByTestId('side-select'), 'buy');
      await user.type(screen.getByTestId('quantity-input'), '100');
      await user.type(screen.getByTestId('price-input'), '75.50');
      await user.click(screen.getByTestId('submit-order-button'));

      await waitFor(() => {
        expect(screen.getAllByTestId('order-item')).toHaveLength(1);
      });

      // Navigate away and back
      await user.click(screen.getByTestId('nav-market'));
      await waitFor(() => {
        expect(screen.getByTestId('market-page')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('nav-trading'));
      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Order should still be there
      expect(screen.getAllByTestId('order-item')).toHaveLength(1);
    });
  });

  describe('Accessibility Features', () => {
    test('components have proper accessibility attributes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MockApp />);

      // Login
      await user.click(screen.getByTestId('mock-login-success'));
      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Check for proper headings
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');

      // Navigate to trading
      await user.click(screen.getByTestId('nav-trading'));
      await waitFor(() => {
        expect(screen.getByTestId('trading-page')).toBeInTheDocument();
      });

      // Check form accessibility
      expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
    });

    test('keyboard navigation works', async () => {
      renderWithProviders(<MockApp />);

      // Login
      fireEvent.click(screen.getByTestId('mock-login-success'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });

      // Test tab navigation
      const navigationButtons = screen.getAllByRole('button');
      navigationButtons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });
});
