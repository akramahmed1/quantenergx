/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LanguageSwitcher from '../LanguageSwitcher';

// Mock the useLanguage hook
jest.mock('../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    changeLanguage: jest.fn(),
    isRTL: false,
    supportedLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ],
  }),
}));

const theme = createTheme();

const MockedLanguageSwitcher = (props: any) => (
  <ThemeProvider theme={theme}>
    <LanguageSwitcher {...props} />
  </ThemeProvider>
);

describe('LanguageSwitcher Component', () => {
  test('renders select variant by default', () => {
    render(<MockedLanguageSwitcher />);

    expect(screen.getByText('Language:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
  });

  test('renders menu variant when specified', () => {
    render(<MockedLanguageSwitcher variant="menu" />);

    expect(screen.getByLabelText('change language')).toBeInTheDocument();
  });

  test('hides label when showLabel is false', () => {
    render(<MockedLanguageSwitcher showLabel={false} />);

    expect(screen.queryByText('Language:')).not.toBeInTheDocument();
  });

  test('opens language menu when menu button is clicked', () => {
    render(<MockedLanguageSwitcher variant="menu" />);

    const menuButton = screen.getByLabelText('change language');
    fireEvent.click(menuButton);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  test('shows all supported languages in select dropdown', () => {
    render(<MockedLanguageSwitcher />);

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
  });

  test('displays current language as selected', () => {
    render(<MockedLanguageSwitcher />);

    // English should be selected by default based on our mock
    expect(screen.getByDisplayValue('English')).toBeInTheDocument();
  });
});