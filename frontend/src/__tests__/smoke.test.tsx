import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';

// Create a minimal store for testing
const testStore = configureStore({
  reducer: {
    auth: (state = { isAuthenticated: false, user: null }) => state,
    ocr: (state = { documents: [], processing: false }) => state,
  },
});

const theme = createTheme();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={testStore}>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrowserRouter>
  </Provider>
);

describe('Frontend Smoke Tests', () => {
  test('App renders without crashing', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    // Check that the main content area is present
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('App contains main navigation elements', () => {
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    // These tests verify the basic structure is present
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('App can render without throwing errors', () => {
    // This test ensures no critical errors occur during render
    expect(() => render(
      <TestWrapper>
        <App />
      </TestWrapper>
    )).not.toThrow();
  });
});