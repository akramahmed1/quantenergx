/*
 * Copyright (c) 2025 QuantEnergX. All rights reserved.
 * This software contains proprietary and confidential information.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * Patent Pending - Application filed under applicable jurisdictions.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardOverview } from '@/components/layout/DashboardOverview';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('DashboardOverview', () => {
  it('renders dashboard title and description', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('navigation.overview')).toBeInTheDocument();
    expect(screen.getByText(/Here's what's happening/)).toBeInTheDocument();
  });

  it('displays all metric cards', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('trading.portfolio_value')).toBeInTheDocument();
    expect(screen.getByText('trading.day_change')).toBeInTheDocument();
    expect(screen.getByText('devices.energy_consumption')).toBeInTheDocument();
    expect(screen.getByText('trading.open_positions')).toBeInTheDocument();
    expect(screen.getByText('analytics.cost_savings')).toBeInTheDocument();
    expect(screen.getByText('Active Devices')).toBeInTheDocument();
  });

  it('shows recent activity section', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText(/Bought 100 ENERGY_USD/)).toBeInTheDocument();
    expect(screen.getByText(/Solar Panel Array came online/)).toBeInTheDocument();
    expect(screen.getByText(/High energy consumption detected/)).toBeInTheDocument();
  });

  it('displays metric values correctly', () => {
    render(<DashboardOverview />);

    expect(screen.getByText('$45,231.89')).toBeInTheDocument();
    expect(screen.getByText('+$2,350.00')).toBeInTheDocument();
    expect(screen.getByText('2,450 kWh')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('$8,420')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('shows trend indicators', () => {
    render(<DashboardOverview />);

    // Check for positive change indicators
    expect(screen.getByText('+20.1% from last month')).toBeInTheDocument();
    expect(screen.getByText('+5.2% today')).toBeInTheDocument();
    expect(screen.getByText('+15% this quarter')).toBeInTheDocument();
  });
});