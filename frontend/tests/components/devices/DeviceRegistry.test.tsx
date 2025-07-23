/*
 * Copyright (c) 2025 QuantEnergX. All rights reserved.
 * This software contains proprietary and confidential information.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * Patent Pending - Application filed under applicable jurisdictions.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DeviceRegistry } from '@/components/devices/DeviceRegistry';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock console.log to avoid test output noise
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('DeviceRegistry', () => {
  afterEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('renders device registry title and description', () => {
    render(<DeviceRegistry />);

    expect(screen.getByText('navigation.device_registry')).toBeInTheDocument();
    expect(screen.getByText(/Manage and monitor your IoT devices/)).toBeInTheDocument();
  });

  it('displays register device button', () => {
    render(<DeviceRegistry />);

    const registerButton = screen.getByText('devices.register_device');
    expect(registerButton).toBeInTheDocument();
  });

  it('shows all device cards with correct information', () => {
    render(<DeviceRegistry />);

    expect(screen.getByText('Main Energy Meter')).toBeInTheDocument();
    expect(screen.getByText('Solar Panel Array')).toBeInTheDocument();
    expect(screen.getByText('Wind Turbine #1')).toBeInTheDocument();
    expect(screen.getByText('Battery Storage Unit')).toBeInTheDocument();
  });

  it('displays device status badges correctly', () => {
    render(<DeviceRegistry />);

    // Check for online devices
    const onlineBadges = screen.getAllByText('devices.online');
    expect(onlineBadges).toHaveLength(3); // Main meter, solar panel, battery

    // Check for maintenance device
    expect(screen.getByText('devices.maintenance')).toBeInTheDocument();
  });

  it('shows device statistics', () => {
    render(<DeviceRegistry />);

    expect(screen.getByText('Device Statistics')).toBeInTheDocument();
    
    // Check statistics (3 online, 0 offline, 1 maintenance based on mock data)
    const statisticsSection = screen.getByText('Device Statistics').closest('div');
    expect(statisticsSection).toContainHTML('3'); // online count
    expect(statisticsSection).toContainHTML('1'); // maintenance count
  });

  it('handles view details button click', () => {
    render(<DeviceRegistry />);

    const viewDetailsButtons = screen.getAllByText(/common.view/);
    fireEvent.click(viewDetailsButtons[0]);

    expect(mockConsoleLog).toHaveBeenCalledWith('View details for device:', '1');
  });

  it('handles register device button click', () => {
    render(<DeviceRegistry />);

    const registerButton = screen.getByText('devices.register_device');
    fireEvent.click(registerButton);

    expect(mockConsoleLog).toHaveBeenCalledWith('Register new device');
  });

  it('displays device energy data correctly', () => {
    render(<DeviceRegistry />);

    // Check for energy consumption values
    expect(screen.getByText('1250 kWh')).toBeInTheDocument(); // Main meter consumption
    expect(screen.getByText('+850 kWh')).toBeInTheDocument(); // Solar panel generation
  });

  it('shows device locations', () => {
    render(<DeviceRegistry />);

    expect(screen.getByText('Building A - Main Panel')).toBeInTheDocument();
    expect(screen.getByText('Rooftop - South Wing')).toBeInTheDocument();
    expect(screen.getByText('Field Area - North')).toBeInTheDocument();
    expect(screen.getByText('Storage Room B')).toBeInTheDocument();
  });
});