/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AnalyticsWidget from '../AnalyticsWidget';

const theme = createTheme();

const MockedAnalyticsWidget = (props: any) => (
  <ThemeProvider theme={theme}>
    <AnalyticsWidget {...props} />
  </ThemeProvider>
);

const sampleData = [
  { timestamp: '2025-01-23T00:00:00Z', value: 45.2 },
  { timestamp: '2025-01-23T01:00:00Z', value: 42.8 },
  { timestamp: '2025-01-23T02:00:00Z', value: 48.1 },
  { timestamp: '2025-01-23T03:00:00Z', value: 51.3 },
];

describe('AnalyticsWidget Component', () => {
  test('renders widget title', () => {
    render(
      <MockedAnalyticsWidget
        title="Energy Prices"
        type="line"
        data={sampleData}
        unit="$/MWh"
      />
    );

    expect(screen.getByText('Energy Prices')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    render(
      <MockedAnalyticsWidget
        title="Energy Prices"
        type="line"
        data={[]}
        loading={true}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error message', () => {
    const errorMessage = 'Failed to load data';
    
    render(
      <MockedAnalyticsWidget
        title="Energy Prices"
        type="line"
        data={[]}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('shows no data message when data is empty', () => {
    render(
      <MockedAnalyticsWidget
        title="Energy Prices"
        type="line"
        data={[]}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  test('displays metric value for metric type', () => {
    render(
      <MockedAnalyticsWidget
        title="Portfolio Value"
        type="metric"
        data={[{ timestamp: 'current', value: 1052000 }]}
        unit="$"
        trend="up"
      />
    );

    expect(screen.getByText('1.05M $')).toBeInTheDocument();
  });

  test('shows trend indicator for metric type', () => {
    render(
      <MockedAnalyticsWidget
        title="Portfolio Value"
        type="metric"
        data={[
          { timestamp: 'current', value: 1052000 },
          { timestamp: 'previous', value: 1000000 }
        ]}
        unit="$"
        trend="up"
      />
    );

    // Check for trend percentage
    expect(screen.getByText(/5.2%/)).toBeInTheDocument();
  });

  test('calls onRefresh when refresh button is clicked', () => {
    const mockOnRefresh = jest.fn();
    
    render(
      <MockedAnalyticsWidget
        title="Energy Prices"
        type="line"
        data={sampleData}
        onRefresh={mockOnRefresh}
      />
    );

    const refreshButton = screen.getByLabelText(/refresh/i);
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
  });

  test('opens time range menu when more options clicked', () => {
    render(
      <MockedAnalyticsWidget
        title="Energy Prices"
        type="line"
        data={sampleData}
        showTimeRange={true}
      />
    );

    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);

    expect(screen.getByText('1 Hour')).toBeInTheDocument();
    expect(screen.getByText('24 Hours')).toBeInTheDocument();
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
  });

  test('formats large numbers correctly', () => {
    render(
      <MockedAnalyticsWidget
        title="Large Number"
        type="metric"
        data={[{ timestamp: 'current', value: 2500000 }]}
        unit="W"
      />
    );

    expect(screen.getByText('2.5M W')).toBeInTheDocument();
  });

  test('displays trend chip for metric widgets', () => {
    render(
      <MockedAnalyticsWidget
        title="Portfolio Value"
        type="metric"
        data={[{ timestamp: 'current', value: 1000 }]}
        trend="up"
      />
    );

    expect(screen.getByText('up')).toBeInTheDocument();
  });
});