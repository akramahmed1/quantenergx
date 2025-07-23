/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';

const theme = createTheme();

const MockedApp = () => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </BrowserRouter>
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('App Component', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  test('renders login when no user is authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<MockedApp />);

    expect(screen.getByRole('heading', { name: /quantenergx/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('renders dashboard when user is authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@quantenergx.com',
      fullName: 'Test User',
      role: 'Energy Analyst',
      organization: 'Test Corp',
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));
    
    render(<MockedApp />);

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});