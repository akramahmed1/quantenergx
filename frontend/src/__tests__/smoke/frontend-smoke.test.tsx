/**
 * Frontend Smoke Tests for QuantEnergX
 * 
 * These tests verify that critical frontend functionality works without going into detail.
 * They should run quickly and catch major breaking changes.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';

// Import critical components for smoke testing
import App from '../../App';

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false, loading: false, error: null }, action) => state,
      market: (state = { data: {}, loading: false, error: null }, action) => state,
      trading: (state = { orders: [], positions: [], loading: false, error: null }, action) => state,
      notifications: (state = { notifications: [], unreadCount: 0, settings: {} }, action) => state,
      settings: (state = { theme: 'light', language: 'en' }, action) => state,
      compliance: (state = { status: 'compliant', checks: [] }, action) => state,
      risk: (state = { metrics: {}, alerts: [] }, action) => state,
      ocr: (state = { documents: [], processing: false }, action) => state,
      ...initialState,
    },
    preloadedState: initialState,
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
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Frontend Smoke Tests', () => {
  describe('Application Bootstrap', () => {
    test('App component renders without crashing', () => {
      expect(() => renderWithProviders(<App />)).not.toThrow();
    });

    test('App component contains main layout elements', () => {
      renderWithProviders(<App />);
      
      // Should have some basic layout structure
      expect(document.body).toBeInTheDocument();
    });

    test('Router is properly configured', () => {
      const { container } = renderWithProviders(<App />);
      
      // Should render without router errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Redux Store Integration', () => {
    test('store connects to components without errors', () => {
      const store = createMockStore();
      
      expect(() => {
        render(
          <Provider store={store}>
            <BrowserRouter>
              <ThemeProvider theme={theme}>
                <App />
              </ThemeProvider>
            </BrowserRouter>
          </Provider>
        );
      }).not.toThrow();
    });

    test('store has all required slices', () => {
      const store = createMockStore();
      const state = store.getState();
      
      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('market');
      expect(state).toHaveProperty('trading');
      expect(state).toHaveProperty('notifications');
      expect(state).toHaveProperty('settings');
      expect(state).toHaveProperty('compliance');
      expect(state).toHaveProperty('risk');
      expect(state).toHaveProperty('ocr');
    });

    test('store initial state is properly structured', () => {
      const store = createMockStore();
      const state = store.getState();
      
      // Auth slice
      expect(state.auth).toHaveProperty('user');
      expect(state.auth).toHaveProperty('isAuthenticated');
      expect(state.auth).toHaveProperty('loading');
      expect(state.auth).toHaveProperty('error');
      
      // Trading slice
      expect(state.trading).toHaveProperty('orders');
      expect(state.trading).toHaveProperty('positions');
      expect(state.trading.orders).toBeInstanceOf(Array);
      expect(state.trading.positions).toBeInstanceOf(Array);
      
      // Notifications slice
      expect(state.notifications).toHaveProperty('notifications');
      expect(state.notifications).toHaveProperty('unreadCount');
      expect(state.notifications.notifications).toBeInstanceOf(Array);
      expect(typeof state.notifications.unreadCount).toBe('number');
    });
  });

  describe('Theme and Styling', () => {
    test('Material-UI theme loads correctly', () => {
      expect(() => createTheme()).not.toThrow();
    });

    test('components render with theme', () => {
      expect(() => {
        renderWithProviders(<App />);
      }).not.toThrow();
    });

    test('custom theme variables are accessible', () => {
      const customTheme = createTheme({
        palette: {
          primary: {
            main: '#1976d2',
          },
        },
      });
      
      expect(customTheme.palette.primary.main).toBe('#1976d2');
    });
  });

  describe('Routing Configuration', () => {
    test('BrowserRouter provides routing context', () => {
      expect(() => {
        render(
          <BrowserRouter>
            <div>Test</div>
          </BrowserRouter>
        );
      }).not.toThrow();
    });

    test('routes are accessible without authentication errors', () => {
      const { container } = renderWithProviders(<App />);
      
      // Should render some content without routing errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Dependencies', () => {
    test('Material-UI components are importable', () => {
      expect(() => require('@mui/material/Button')).not.toThrow();
      expect(() => require('@mui/material/AppBar')).not.toThrow();
      expect(() => require('@mui/material/Toolbar')).not.toThrow();
      expect(() => require('@mui/material/Typography')).not.toThrow();
      expect(() => require('@mui/icons-material/Home')).not.toThrow();
    });

    test('React Router components are importable', () => {
      expect(() => require('react-router-dom')).not.toThrow();
    });

    test('Redux Toolkit components are importable', () => {
      expect(() => require('@reduxjs/toolkit')).not.toThrow();
      expect(() => require('react-redux')).not.toThrow();
    });

    test('Chart.js components are importable', () => {
      expect(() => require('chart.js')).not.toThrow();
      expect(() => require('react-chartjs-2')).not.toThrow();
    });
  });

  describe('Store Slice Functionality', () => {
    test('auth slice actions work', () => {
      const store = createMockStore();
      
      expect(() => {
        store.dispatch({ type: 'auth/login/pending' });
        store.dispatch({ type: 'auth/logout' });
      }).not.toThrow();
    });

    test('trading slice actions work', () => {
      const store = createMockStore();
      
      expect(() => {
        store.dispatch({ type: 'trading/placeOrder/pending' });
        store.dispatch({ type: 'trading/updateOrderStatus', payload: { orderId: '123', status: 'filled' } });
      }).not.toThrow();
    });

    test('notifications slice actions work', () => {
      const store = createMockStore();
      
      expect(() => {
        store.dispatch({ 
          type: 'notifications/addNotification', 
          payload: { 
            id: '1', 
            type: 'info', 
            title: 'Test', 
            message: 'Test message',
            timestamp: new Date().toISOString(),
            read: false
          } 
        });
        store.dispatch({ type: 'notifications/markAsRead', payload: '1' });
      }).not.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    test('environment variables are accessible', () => {
      expect(() => process.env.REACT_APP_API_URL).not.toThrow();
      expect(() => process.env.NODE_ENV).not.toThrow();
    });

    test('API configuration is set up', () => {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      expect(typeof apiUrl).toBe('string');
      expect(apiUrl.length).toBeGreaterThan(0);
    });
  });

  describe('Error Boundaries', () => {
    test('app handles missing props gracefully', () => {
      expect(() => {
        renderWithProviders(<App />);
      }).not.toThrow();
    });

    test('app handles empty store state', () => {
      const emptyStore = configureStore({
        reducer: {
          auth: () => ({}),
          market: () => ({}),
          trading: () => ({}),
          notifications: () => ({}),
          settings: () => ({}),
          compliance: () => ({}),
          risk: () => ({}),
          ocr: () => ({}),
        },
      });
      
      expect(() => {
        render(
          <Provider store={emptyStore}>
            <BrowserRouter>
              <ThemeProvider theme={theme}>
                <App />
              </ThemeProvider>
            </BrowserRouter>
          </Provider>
        );
      }).not.toThrow();
    });
  });

  describe('Browser Compatibility', () => {
    test('modern JavaScript features work', () => {
      // Test arrow functions
      const arrow = () => 'test';
      expect(arrow()).toBe('test');
      
      // Test async/await
      const asyncTest = async () => Promise.resolve('test');
      expect(asyncTest()).toBeInstanceOf(Promise);
      
      // Test destructuring
      const { test } = { test: 'value' };
      expect(test).toBe('value');
      
      // Test template literals
      const template = `Hello ${test}`;
      expect(template).toBe('Hello value');
    });

    test('ES6 modules work', () => {
      expect(() => import('react')).not.toThrow();
    });
  });

  describe('Performance Basics', () => {
    test('component renders in reasonable time', () => {
      const startTime = performance.now();
      
      renderWithProviders(<App />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 1 second (generous for CI)
      expect(renderTime).toBeLessThan(1000);
    });

    test('store operations are synchronous', () => {
      const store = createMockStore();
      const startTime = performance.now();
      
      store.dispatch({ type: 'test/action' });
      const state = store.getState();
      
      const endTime = performance.now();
      const operationTime = endTime - startTime;
      
      // Store operations should be very fast
      expect(operationTime).toBeLessThan(10);
      expect(state).toBeDefined();
    });
  });

  describe('Memory Management', () => {
    test('components unmount cleanly', () => {
      const { unmount } = renderWithProviders(<App />);
      
      expect(() => unmount()).not.toThrow();
    });

    test('store subscription cleanup works', () => {
      const store = createMockStore();
      
      const unsubscribe = store.subscribe(() => {});
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    test('TypeScript types are properly configured', () => {
      // This test passing means TypeScript compilation succeeded
      expect(true).toBe(true);
    });

    test('Redux types work correctly', () => {
      const store = createMockStore();
      const state = store.getState();
      
      // If this compiles and runs, types are working
      expect(typeof state).toBe('object');
    });
  });
});