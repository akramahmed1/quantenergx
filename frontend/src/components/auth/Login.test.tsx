/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Login from '../Login';

const theme = createTheme();

const MockedLogin = ({ onLogin, onSwitchToRegister, loading = false, error }: any) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <Login
        onLogin={onLogin}
        onSwitchToRegister={onSwitchToRegister}
        loading={loading}
        error={error}
      />
    </ThemeProvider>
  </BrowserRouter>
);

describe('Login Component', () => {
  const mockOnLogin = jest.fn();
  const mockOnSwitchToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    expect(screen.getByRole('heading', { name: /quantenergx/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('calls onLogin with correct credentials', async () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@quantenergx.com' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@quantenergx.com', 'SecurePass123!');
    });
  });

  test('shows error message when provided', () => {
    const errorMessage = 'Invalid credentials';
    
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('disables login button when loading', () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
        loading={true}
      />
    );

    const loginButton = screen.getByRole('button', { name: /loading/i });
    expect(loginButton).toBeDisabled();
  });

  test('calls onSwitchToRegister when register link is clicked', () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const registerLink = screen.getByRole('button', { name: /register/i });
    fireEvent.click(registerLink);

    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  test('toggles password visibility', () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  test('validates email format', async () => {
    render(
      <MockedLogin
        onLogin={mockOnLogin}
        onSwitchToRegister={mockOnSwitchToRegister}
      />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });

    expect(mockOnLogin).not.toHaveBeenCalled();
  });
});