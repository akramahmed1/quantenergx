import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ArbitrageAlerts from '../components/ArbitrageAlerts';

const theme = createTheme();

const meta: Meta<typeof ArbitrageAlerts> = {
  title: 'Trading/ArbitrageAlerts',
  component: ArbitrageAlerts,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    userId: {
      control: 'text',
      description: 'User ID for personalized alerts',
    },
    region: {
      control: 'select',
      options: ['guyana', 'middle-east', 'us', 'europe', 'uk'],
      description: 'Regional market focus',
    },
    compactMode: {
      control: 'boolean',
      description: 'Enable compact display mode',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    userId: 'demo-user',
    region: 'us',
    compactMode: false,
  },
};

export const CompactMode: Story = {
  args: {
    userId: 'demo-user',
    region: 'us',
    compactMode: true,
  },
};

export const GuyanaRegion: Story = {
  args: {
    userId: 'guyana-trader',
    region: 'guyana',
    compactMode: false,
  },
};

export const MiddleEastRegion: Story = {
  args: {
    userId: 'me-trader',
    region: 'middle-east',
    compactMode: false,
  },
};

export const EuropeRegion: Story = {
  args: {
    userId: 'eu-trader',
    region: 'europe',
    compactMode: false,
  },
};

export const UKRegion: Story = {
  args: {
    userId: 'uk-trader',
    region: 'uk',
    compactMode: false,
  },
};

// Story with mock WebSocket data
export const WithMockData: Story = {
  args: {
    userId: 'demo-user',
    region: 'us',
    compactMode: false,
  },
  parameters: {
    mockData: [
      {
        id: 'alert-1',
        timestamp: new Date(),
        commodity: 'Crude Oil',
        market1: {
          name: 'NYMEX',
          price: 75.50,
          currency: 'USD',
          region: 'us',
        },
        market2: {
          name: 'ICE Futures',
          price: 78.20,
          currency: 'USD',
          region: 'us',
        },
        spread: 2.70,
        spreadPercentage: 3.58,
        profitPotential: 2700,
        severity: 'medium' as const,
        compliance: {
          region: 'us',
          status: 'compliant' as const,
        },
        expiresAt: new Date(Date.now() + 300000),
      },
    ],
  },
};

// Story for mobile view
export const Mobile: Story = {
  args: {
    userId: 'mobile-user',
    region: 'us',
    compactMode: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Story for testing different severities
export const DifferentSeverities: Story = {
  args: {
    userId: 'demo-user',
    region: 'us',
    compactMode: false,
  },
  parameters: {
    mockData: [
      {
        id: 'critical-alert',
        timestamp: new Date(),
        commodity: 'Natural Gas',
        market1: { name: 'NYMEX', price: 3.50, currency: 'USD', region: 'us' },
        market2: { name: 'ICE', price: 3.85, currency: 'USD', region: 'us' },
        spread: 0.35,
        spreadPercentage: 10.0,
        profitPotential: 350,
        severity: 'critical' as const,
        compliance: { region: 'us', status: 'warning' as const, notes: 'High volatility alert' },
        expiresAt: new Date(Date.now() + 600000),
      },
      {
        id: 'high-alert',
        timestamp: new Date(),
        commodity: 'Gasoline',
        market1: { name: 'RBOB', price: 2.10, currency: 'USD', region: 'us' },
        market2: { name: 'ICE', price: 2.25, currency: 'USD', region: 'us' },
        spread: 0.15,
        spreadPercentage: 7.14,
        profitPotential: 150,
        severity: 'high' as const,
        compliance: { region: 'us', status: 'compliant' as const },
        expiresAt: new Date(Date.now() + 400000),
      },
      {
        id: 'low-alert',
        timestamp: new Date(),
        commodity: 'Heating Oil',
        market1: { name: 'NYMEX', price: 2.85, currency: 'USD', region: 'us' },
        market2: { name: 'ICE', price: 2.88, currency: 'USD', region: 'us' },
        spread: 0.03,
        spreadPercentage: 1.05,
        profitPotential: 30,
        severity: 'low' as const,
        compliance: { region: 'us', status: 'compliant' as const },
        expiresAt: new Date(Date.now() + 200000),
      },
    ],
  },
};