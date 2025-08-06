# AI Trading UI User Onboarding Guide

## Welcome to QuantEnergx AI Trading Platform

This guide will help you get started with the new AI Trading UI features, including real-time arbitrage alerts and quantum-enhanced Jupyter notebooks.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Arbitrage Alerts](#arbitrage-alerts)
3. [Quantum Notebooks](#quantum-notebooks)
4. [Regional Settings](#regional-settings)
5. [Mobile Features](#mobile-features)
6. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. **Login to the Platform**
   - Navigate to `/login`
   - Enter your credentials
   - Enable biometric authentication (recommended for mobile)

2. **Regional Configuration**
   - Go to Settings → Regional Preferences
   - Select your primary trading region:
     - **Guyana**: For South American energy markets
     - **Middle East**: For MENA region trading
     - **United States**: For North American markets
     - **Europe**: For European energy exchanges
     - **United Kingdom**: For UK-specific markets

3. **Notification Preferences**
   - Allow browser notifications for real-time alerts
   - Configure push notifications for mobile devices
   - Set alert severity thresholds

## Arbitrage Alerts

The Arbitrage Alerts feature monitors energy markets in real-time to identify trading opportunities with price discrepancies between different exchanges.

### Accessing Arbitrage Alerts

Navigate to `/arbitrage` from the main menu or dashboard.

### Understanding Alert Components

#### Alert Cards
Each arbitrage opportunity is displayed as a card showing:
- **Commodity**: Type of energy product (Crude Oil, Natural Gas, etc.)
- **Spread Percentage**: Price difference between markets
- **Severity Level**: 
  - 🟢 **Low** (1-2%): Small opportunities
  - 🟡 **Medium** (2-5%): Moderate profit potential
  - 🟠 **High** (5-8%): Significant opportunities
  - 🔴 **Critical** (8%+): Major arbitrage opportunities

#### Detailed View
Click the expand button (▼) on any alert to see:
- **Market Comparison Table**: Side-by-side price comparison
- **Interactive Price Chart**: Visual representation using Plotly
- **Compliance Status**: Regional regulatory compliance
- **Profit Calculations**: Estimated profit potential
- **Expiration Time**: When the opportunity expires

### Taking Action on Alerts

1. **View Details**: Click "View Full Analysis" for comprehensive market data
2. **Execute Trade**: Use the "Execute Trade" button (requires proper permissions)
3. **Set Notifications**: Toggle alert notifications on/off
4. **Regional Filtering**: Alerts are automatically filtered by your region

### Alert Severity Guide

| Severity | Spread Range | Action Recommended |
|----------|-------------|-------------------|
| Low | 1-2% | Monitor, small position |
| Medium | 2-5% | Consider trade execution |
| High | 5-8% | Strong trade signal |
| Critical | 8%+ | Immediate attention required |

## Quantum Notebooks

Quantum Notebooks provide an integrated environment for running quantum-enhanced trading algorithms and market analysis.

### Accessing Notebooks

Navigate to `/notebook` or `/notebook/{notebookId}` for specific notebooks.

### Notebook Interface

#### Toolbar Features
- **Save**: Preserve your work
- **Add Cell**: Insert new code, markdown, or raw cells
- **Execute**: Run individual cells or entire notebook
- **Fullscreen**: Expand for immersive analysis
- **Kernel Status**: Monitor execution state

#### Cell Types

1. **Code Cells**
   - Execute Python code with quantum libraries
   - Access to trading data and market APIs
   - Built-in plotting capabilities

2. **Markdown Cells**
   - Documentation and explanations
   - Mathematical formulas using LaTeX
   - Rich text formatting

3. **Raw Cells**
   - Unprocessed text output
   - Configuration data
   - Custom formats

### Pre-loaded Libraries

Your quantum notebooks come with:
- **Qiskit**: Quantum computing framework
- **NumPy/Pandas**: Data analysis
- **Matplotlib/Plotly**: Visualization
- **QuantLib**: Financial modeling
- **Market Data APIs**: Real-time and historical data

### Sample Workflows

#### 1. Basic Market Analysis
```python
import numpy as np
import pandas as pd
import plotly.graph_objects as go

# Load market data
market_data = get_market_data('CRUDE_OIL', days=30)
print(f"Loaded {len(market_data)} data points")
market_data.head()
```

#### 2. Quantum Circuit for Price Prediction
```python
from qiskit import QuantumCircuit, Aer, execute

# Create quantum circuit
qc = QuantumCircuit(3, 3)
qc.h(0)  # Superposition
qc.cx(0, 1)  # Entanglement
qc.measure_all()

# Execute and analyze results
backend = Aer.get_backend('qasm_simulator')
job = execute(qc, backend, shots=1000)
result = job.result()
```

### Notebook Management

- **Save**: Ctrl+S (Cmd+S on Mac)
- **Execute Cell**: Shift+Enter
- **Add Cell**: Click the "+" button
- **Delete Cell**: Select cell and click delete icon
- **Reorder Cells**: Drag and drop (coming soon)

## Regional Settings

### Available Regions

#### Guyana (GY)
- **Currency**: Guyanese Dollar (GYD)
- **Trading Hours**: 09:00 - 15:00 (America/Guyana)
- **Markets**: Georgetown Exchange, Suriname Market
- **Specialties**: Oil & gas exploration, renewable energy

#### Middle East (ME)
- **Currency**: UAE Dirham (AED)
- **Trading Hours**: 10:00 - 14:00 (Asia/Dubai)
- **Markets**: Dubai Mercantile, Qatar Exchange
- **Specialties**: Crude oil, petrochemicals, solar energy

#### United States (US)
- **Currency**: US Dollar (USD)
- **Trading Hours**: 09:30 - 16:00 (America/New_York)
- **Markets**: NYMEX, ICE Futures
- **Specialties**: Comprehensive energy trading

#### Europe (EU)
- **Currency**: Euro (EUR)
- **Trading Hours**: 09:00 - 17:30 (Europe/Frankfurt)
- **Markets**: ICE Europe, EEX
- **Specialties**: Renewable energy, carbon trading

#### United Kingdom (UK)
- **Currency**: British Pound (GBP)
- **Trading Hours**: 08:00 - 16:30 (Europe/London)
- **Markets**: ICE Futures Europe, London Exchange
- **Specialties**: Energy derivatives, gas trading

### Switching Regions

1. Go to **Settings** → **Regional Preferences**
2. Select your new primary region
3. Confirm compliance requirements
4. Update will take effect immediately

## Mobile Features

### Responsive Design
- Touch-optimized interface
- Collapsible sidebars
- Swipe gestures for navigation
- Optimized charts and visualizations

### Offline Capabilities
- Cache recent alerts
- Sync when connection restored
- Offline notebook editing
- Background data updates

### Push Notifications
- Critical arbitrage alerts
- Notebook execution completion
- Market opening/closing times
- System maintenance notices

### Biometric Authentication
- Fingerprint login
- Face ID/Face unlock
- Secure token storage
- Quick access to alerts

## Troubleshooting

### Common Issues

#### WebSocket Connection Problems
**Symptoms**: "Disconnected" status, no real-time updates
**Solutions**:
1. Check internet connection
2. Disable ad blockers
3. Try different browser
4. Contact support if persistent

#### Notebook Execution Errors
**Symptoms**: Cells fail to execute, kernel errors
**Solutions**:
1. Restart kernel: Kernel → Restart
2. Check code syntax
3. Verify data availability
4. Clear outputs and re-run

#### Missing Arbitrage Alerts
**Symptoms**: No alerts appearing
**Solutions**:
1. Verify regional settings
2. Check notification permissions
3. Confirm market hours
4. Review alert severity filters

### Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |

### Performance Optimization

1. **Close unused notebooks**: Reduce memory usage
2. **Clear browser cache**: Resolve loading issues
3. **Disable other tabs**: Free up resources
4. **Use mobile app**: Better performance on mobile

## Getting Help

### Support Channels
- **In-app Help**: Click ? icon in any interface
- **Live Chat**: Available during trading hours
- **Email Support**: support@quantenergx.com
- **Community Forum**: Community discussions and tips

### Training Resources
- **Video Tutorials**: Step-by-step guides
- **Webinars**: Weekly training sessions
- **API Documentation**: Developer resources
- **Sample Notebooks**: Pre-built analysis templates

### Advanced Features
- **Custom Indicators**: Build your own trading signals
- **API Integration**: Connect external data sources
- **Algorithmic Trading**: Deploy automated strategies
- **Risk Management**: Portfolio optimization tools

---

**Next Steps**: 
1. Complete your regional setup
2. Explore sample notebooks
3. Set up arbitrage alert preferences
4. Join our weekly training webinar

Welcome to the future of energy trading! 🚀