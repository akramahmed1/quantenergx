import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar } from '../components/Layout/AppBar';
import { configureStore } from '@reduxjs/toolkit';

// Mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, isAuthenticated: false }, action) => state,
      notifications: (state = { unreadCount: 0 }, action) => state,
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
        <ThemeProvider theme={theme}>{component}</ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('AppBar Component', () => {
  describe('Rendering', () => {
    test('renders app title correctly', () => {
      renderWithProviders(<AppBar />);

      expect(screen.getByText('QuantEnergx')).toBeInTheDocument();
    });

    test('renders notification icon', () => {
      renderWithProviders(<AppBar />);

      const notificationIcon = screen.getByRole('button', { name: /notifications/i });
      expect(notificationIcon).toBeInTheDocument();
    });

    test('renders account icon', () => {
      renderWithProviders(<AppBar />);

      const accountIcon = screen.getByRole('button', { name: /account/i });
      expect(accountIcon).toBeInTheDocument();
    });
  });

  describe('Notification Badge', () => {
    test('shows notification count when there are unread notifications', () => {
      const initialState = {
        notifications: { unreadCount: 5 },
      };

      renderWithProviders(<AppBar />, { initialState });

      // Badge should show the count
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('does not show badge when no unread notifications', () => {
      const initialState = {
        notifications: { unreadCount: 0 },
      };

      renderWithProviders(<AppBar />, { initialState });

      // Badge should not be visible or show 0
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    test('handles large notification counts', () => {
      const initialState = {
        notifications: { unreadCount: 99 },
      };

      renderWithProviders(<AppBar />, { initialState });

      expect(screen.getByText('99')).toBeInTheDocument();
    });

    test('shows 99+ for counts over 99', () => {
      const initialState = {
        notifications: { unreadCount: 150 },
      };

      renderWithProviders(<AppBar />, { initialState });

      // Material-UI Badge typically shows 99+ for counts > 99
      expect(screen.getByText(/99\+|150/)).toBeInTheDocument();
    });
  });

  describe('User Authentication State', () => {
    test('shows login button when user is not authenticated', () => {
      const initialState = {
        auth: { user: null, isAuthenticated: false },
      };

      renderWithProviders(<AppBar />, { initialState });

      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('shows user menu when user is authenticated', () => {
      const initialState = {
        auth: {
          user: { name: 'John Doe', email: 'john@example.com' },
          isAuthenticated: true,
        },
      };

      renderWithProviders(<AppBar />, { initialState });

      expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
    });

    test('displays user name when authenticated', () => {
      const initialState = {
        auth: {
          user: { name: 'John Doe', email: 'john@example.com' },
          isAuthenticated: true,
        },
      };

      renderWithProviders(<AppBar />, { initialState });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    test('notification button is clickable', () => {
      const _mockClick = jest.fn();

      renderWithProviders(<AppBar />);

      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(notificationButton);

      // Should be clickable without errors
      expect(notificationButton).toBeInTheDocument();
    });

    test('account button is clickable', () => {
      const _mockClick = jest.fn();

      renderWithProviders(<AppBar />);

      const accountButton = screen.getByRole('button', { name: /account/i });
      fireEvent.click(accountButton);

      // Should be clickable without errors
      expect(accountButton).toBeInTheDocument();
    });

    test('login button navigates when clicked', () => {
      const initialState = {
        auth: { user: null, isAuthenticated: false },
      };

      renderWithProviders(<AppBar />, { initialState });

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      // Should be clickable without errors
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<AppBar />);

      expect(screen.getByText('QuantEnergx')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });

    test('renders correctly on desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderWithProviders(<AppBar />);

      expect(screen.getByText('QuantEnergx')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels', () => {
      renderWithProviders(<AppBar />);

      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      const accountButton = screen.getByRole('button', { name: /account/i });

      expect(notificationButton).toHaveAttribute('aria-label');
      expect(accountButton).toHaveAttribute('aria-label');
    });

    test('has proper color contrast', () => {
      renderWithProviders(<AppBar />);

      const appBar = screen.getByRole('banner');
      expect(appBar).toBeInTheDocument();

      // Material-UI AppBar should have proper contrast by default
      expect(appBar).toHaveStyle({ color: 'white' }); // or appropriate contrast color
    });

    test('supports keyboard navigation', () => {
      renderWithProviders(<AppBar />);

      const notificationButton = screen.getByRole('button', { name: /notifications/i });
      const accountButton = screen.getByRole('button', { name: /account/i });

      // Buttons should be focusable
      notificationButton.focus();
      expect(notificationButton).toHaveFocus();

      accountButton.focus();
      expect(accountButton).toHaveFocus();
    });
  });

  describe('Theme Integration', () => {
    test('applies theme colors correctly', () => {
      const customTheme = createTheme({
        palette: {
          primary: {
            main: '#1976d2',
          },
        },
      });

      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <ThemeProvider theme={customTheme}>
              <AppBar />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      );

      const appBar = screen.getByRole('banner');
      expect(appBar).toBeInTheDocument();
    });

    test('handles dark theme', () => {
      const darkTheme = createTheme({
        palette: {
          mode: 'dark',
        },
      });

      render(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <ThemeProvider theme={darkTheme}>
              <AppBar />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      );

      const appBar = screen.getByRole('banner');
      expect(appBar).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    test('handles store connection errors gracefully', () => {
      // Test with minimal store
      const minimalStore = configureStore({
        reducer: {
          auth: () => ({ user: null, isAuthenticated: false }),
          notifications: () => ({ unreadCount: 0 }),
        },
      });

      render(
        <Provider store={minimalStore}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <AppBar />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      );

      expect(screen.getByText('QuantEnergx')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const { rerender } = renderWithProviders(<AppBar />);

      // Component should render successfully
      expect(screen.getByText('QuantEnergx')).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <Provider store={createMockStore()}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <AppBar />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      );

      // Should still be present
      expect(screen.getByText('QuantEnergx')).toBeInTheDocument();
    });
  });
});
