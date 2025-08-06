import type { Meta, StoryObj } from '@storybook/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import QuantumNotebook from '../components/QuantumNotebook';

const theme = createTheme();

const meta: Meta<typeof QuantumNotebook> = {
  title: 'Analytics/QuantumNotebook',
  component: QuantumNotebook,
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
    notebookId: {
      control: 'text',
      description: 'Notebook ID for loading specific notebook',
    },
    readOnly: {
      control: 'boolean',
      description: 'Enable read-only mode',
    },
    height: {
      control: 'text',
      description: 'Height of the notebook container',
    },
    compactMode: {
      control: 'boolean',
      description: 'Enable compact display mode',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNotebook = {
  id: 'quantum-trading-sample',
  name: 'Quantum Trading Analysis',
  cells: [
    {
      id: 'cell-1',
      type: 'markdown' as const,
      content: '# Quantum Energy Trading Analysis\n\nThis notebook demonstrates quantum-enhanced trading algorithms for energy commodity markets.\n\n## Key Features\n- Quantum circuit optimization\n- Market data analysis\n- Risk assessment\n- Arbitrage detection',
    },
    {
      id: 'cell-2',
      type: 'code' as const,
      content: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit, Aer, execute
import plotly.graph_objects as go

# Initialize quantum trading parameters
print("Quantum Trading System Initialized")
quantum_advantage = True
print(f"Quantum advantage enabled: {quantum_advantage}")`,
      outputs: [
        {
          output_type: 'execute_result',
          execution_count: 1,
          data: {
            'text/plain': 'Quantum Trading System Initialized\nQuantum advantage enabled: True',
          },
        },
      ],
      executionCount: 1,
    },
    {
      id: 'cell-3',
      type: 'code' as const,
      content: `# Generate sample market data
np.random.seed(42)
dates = pd.date_range('2024-01-01', periods=100, freq='D')
prices = 100 + np.cumsum(np.random.randn(100) * 0.5)
market_data = pd.DataFrame({'date': dates, 'price': prices})

print(f"Generated {len(market_data)} days of market data")
print("Price range:", market_data['price'].min(), "to", market_data['price'].max())
market_data.head()`,
      outputs: [
        {
          output_type: 'execute_result',
          execution_count: 2,
          data: {
            'text/plain': `Generated 100 days of market data
Price range: 97.23 to 102.45
        date      price
0 2024-01-01  100.4967
1 2024-01-02   99.8616
2 2024-01-03  100.6476
3 2024-01-04  101.5230
4 2024-01-05  100.7674`,
          },
        },
      ],
      executionCount: 2,
    },
    {
      id: 'cell-4',
      type: 'code' as const,
      content: `# Create quantum circuit for price prediction
qc = QuantumCircuit(3, 3)
qc.h(0)  # Hadamard gate for superposition
qc.cx(0, 1)  # CNOT for entanglement
qc.cx(1, 2)  # Second CNOT
qc.measure_all()

print("Quantum price prediction circuit created")
print("Circuit depth:", qc.depth())
print("Number of qubits:", qc.num_qubits)`,
      outputs: [
        {
          output_type: 'execute_result',
          execution_count: 3,
          data: {
            'text/plain': `Quantum price prediction circuit created
Circuit depth: 3
Number of qubits: 3`,
          },
        },
      ],
      executionCount: 3,
    },
    {
      id: 'cell-5',
      type: 'markdown' as const,
      content: '## Arbitrage Detection\n\nUsing quantum algorithms to detect arbitrage opportunities across multiple energy markets.',
    },
    {
      id: 'cell-6',
      type: 'code' as const,
      content: `# Simulate arbitrage detection
markets = ['NYMEX', 'ICE', 'LME', 'CME']
commodities = ['Crude Oil', 'Natural Gas', 'Gasoline']

arbitrage_opportunities = []
for commodity in commodities:
    for i, market1 in enumerate(markets):
        for market2 in markets[i+1:]:
            spread = np.random.random() * 5  # Random spread 0-5%
            if spread > 2:  # Significant arbitrage opportunity
                arbitrage_opportunities.append({
                    'commodity': commodity,
                    'market1': market1,
                    'market2': market2,
                    'spread_pct': spread
                })

print(f"Found {len(arbitrage_opportunities)} arbitrage opportunities")
for opp in arbitrage_opportunities[:3]:  # Show first 3
    print(f"{opp['commodity']}: {opp['market1']} vs {opp['market2']} ({opp['spread_pct']:.2f}% spread)")`,
      outputs: [],
    },
  ],
  metadata: {
    kernelspec: {
      name: 'python3',
      display_name: 'Python 3 (Quantum)',
      language: 'python',
    },
    language_info: {
      name: 'python',
      version: '3.9.0',
    },
  },
  lastModified: new Date(),
};

export const Default: Story = {
  args: {
    readOnly: false,
    height: '600px',
    compactMode: false,
  },
};

export const WithSampleNotebook: Story = {
  args: {
    initialNotebook: sampleNotebook,
    readOnly: false,
    height: '600px',
    compactMode: false,
  },
};

export const ReadOnlyMode: Story = {
  args: {
    initialNotebook: sampleNotebook,
    readOnly: true,
    height: '600px',
    compactMode: false,
  },
};

export const CompactMode: Story = {
  args: {
    initialNotebook: sampleNotebook,
    readOnly: false,
    height: '400px',
    compactMode: true,
  },
};

export const TallNotebook: Story = {
  args: {
    initialNotebook: sampleNotebook,
    readOnly: false,
    height: '800px',
    compactMode: false,
  },
};

export const Mobile: Story = {
  args: {
    initialNotebook: sampleNotebook,
    readOnly: false,
    height: '500px',
    compactMode: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Story for empty notebook
export const EmptyNotebook: Story = {
  args: {
    initialNotebook: {
      id: 'empty-notebook',
      name: 'New Notebook',
      cells: [
        {
          id: 'empty-cell',
          type: 'code' as const,
          content: '',
          outputs: [],
        },
      ],
      metadata: {
        kernelspec: {
          name: 'python3',
          display_name: 'Python 3 (Quantum)',
          language: 'python',
        },
        language_info: {
          name: 'python',
          version: '3.9.0',
        },
      },
      lastModified: new Date(),
    },
    readOnly: false,
    height: '600px',
    compactMode: false,
  },
};

// Story for notebook with errors
export const WithErrors: Story = {
  args: {
    initialNotebook: {
      ...sampleNotebook,
      cells: [
        ...sampleNotebook.cells,
        {
          id: 'error-cell',
          type: 'code' as const,
          content: 'print("This will cause an error")\nundefined_variable = some_undefined_function()',
          outputs: [
            {
              output_type: 'error',
              ename: 'NameError',
              evalue: "name 'some_undefined_function' is not defined",
              traceback: [
                'Traceback (most recent call last):',
                '  File "<stdin>", line 2, in <module>',
                "NameError: name 'some_undefined_function' is not defined",
              ],
            },
          ],
          executionCount: 4,
        },
      ],
    },
    readOnly: false,
    height: '600px',
    compactMode: false,
  },
};

// Story for loading state
export const Loading: Story = {
  args: {
    notebookId: 'loading-notebook',
    readOnly: false,
    height: '600px',
    compactMode: false,
  },
};