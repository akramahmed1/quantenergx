# QuantEnergx Frontend

> React-based user interface for the QuantEnergx energy trading platform

## 🎨 Overview

The frontend is a modern, responsive web application built with React and TypeScript, designed specifically for energy commodity trading. It provides an intuitive interface for traders, risk managers, and compliance officers to interact with the QuantEnergx platform.

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit with RTK Query
- **UI Framework**: Material-UI (MUI) with custom trading components
- **Charts**: TradingView Charting Library for advanced price visualization
- **Routing**: React Router v6 with protected routes
- **Real-time**: WebSocket integration for live market data
- **Testing**: Jest, React Testing Library, and Cypress
- **Build Tool**: Vite for fast development and building

### Key Features
- **Trading Interface**: Professional trading dashboard with order management
- **Market Data Visualization**: Real-time charts and price feeds
- **Portfolio Management**: Position tracking and performance analytics
- **Risk Management**: Real-time risk monitoring and alerts
- **Compliance Dashboard**: Regulatory reporting and audit trails
- **Responsive Design**: Mobile-friendly interface for on-the-go trading

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Common UI elements
│   │   ├── trading/         # Trading-specific components
│   │   ├── charts/          # Chart and visualization components
│   │   ├── forms/           # Form components
│   │   └── layout/          # Layout components
│   ├── pages/               # Page-level components
│   │   ├── dashboard/       # Main trading dashboard
│   │   ├── trading/         # Trading interface pages
│   │   ├── portfolio/       # Portfolio management pages
│   │   ├── compliance/      # Compliance and reporting pages
│   │   ├── settings/        # User settings and preferences
│   │   └── auth/            # Authentication pages
│   ├── store/               # Redux store configuration
│   │   ├── slices/          # Redux Toolkit slices
│   │   ├── api/             # RTK Query API definitions
│   │   └── middleware/      # Custom middleware
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   ├── services/            # API and external service integrations
│   ├── types/               # TypeScript type definitions
│   ├── styles/              # Global styles and themes
│   ├── assets/              # Static assets (images, icons)
│   └── tests/               # Test utilities and mocks
├── public/                  # Public assets
├── cypress/                 # End-to-end tests
├── docs/                    # Component documentation
└── package.json             # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

### Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
npm run test:coverage

# Run end-to-end tests
npm run cypress:open
npm run cypress:run

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run type-check

# Analyze bundle size
npm run analyze
```

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_WEBSOCKET_URL=ws://localhost:3001/ws

# Authentication
REACT_APP_JWT_STORAGE_KEY=quantenergx_token
REACT_APP_REFRESH_TOKEN_KEY=quantenergx_refresh

# Market Data
REACT_APP_TRADINGVIEW_API_KEY=your-tradingview-key
REACT_APP_MARKET_DATA_REFRESH_INTERVAL=1000

# Feature Flags
REACT_APP_ENABLE_ADVANCED_CHARTS=true
REACT_APP_ENABLE_MOBILE_TRADING=true
REACT_APP_ENABLE_DARK_MODE=true

# Analytics
REACT_APP_ANALYTICS_ID=your-analytics-id
REACT_APP_ERROR_REPORTING_DSN=your-sentry-dsn
```

## 🎨 UI Components

### Core Components

#### Trading Components
- **OrderTicket**: Order creation and modification interface
- **OrderBook**: Live order book display
- **PositionGrid**: Portfolio positions table
- **TradingChart**: Advanced price charting with TradingView
- **MarketDepth**: Market depth visualization
- **TradeHistory**: Transaction history display

#### Common Components
- **DataGrid**: Enhanced data table with sorting and filtering
- **RealTimePrice**: Live price display component
- **AlertBanner**: System and user alerts
- **LoadingSpinner**: Loading state indicators
- **ErrorBoundary**: Error handling wrapper
- **ConfirmDialog**: Confirmation dialogs for critical actions

#### Layout Components
- **Navigation**: Main navigation sidebar
- **Header**: Top header with user info and notifications
- **Dashboard**: Grid-based dashboard layout
- **PageContainer**: Standard page wrapper
- **Sidebar**: Collapsible sidebar component

### Styling and Themes

The application uses Material-UI with custom themes for trading interfaces:

```typescript
// Trading theme with dark mode support
const tradingTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00C853', // Success green
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF1744', // Danger red
      contrastText: '#fff',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  components: {
    // Custom component styles
  },
});
```

## 📊 State Management

### Redux Store Structure

```typescript
interface RootState {
  auth: AuthState;
  trading: TradingState;
  portfolio: PortfolioState;
  marketData: MarketDataState;
  ui: UIState;
  notifications: NotificationState;
}
```

### Key Slices

#### Auth Slice
- User authentication state
- JWT token management
- Role-based permissions

#### Trading Slice
- Active orders
- Order history
- Trading preferences

#### Portfolio Slice
- Current positions
- Performance metrics
- Risk calculations

#### Market Data Slice
- Real-time prices
- Historical data
- Market status

### API Integration

Using RTK Query for efficient API management:

```typescript
export const tradingApi = createApi({
  reducerPath: 'tradingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1/trading',
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState());
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Order', 'Position'],
  endpoints: (builder) => ({
    getOrders: builder.query<Order[], void>({
      query: () => 'orders',
      providesTags: ['Order'],
    }),
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (order) => ({
        url: 'orders',
        method: 'POST',
        body: order,
      }),
      invalidatesTags: ['Order', 'Position'],
    }),
  }),
});
```

## 🔄 Real-time Features

### WebSocket Integration

Real-time market data and notifications are handled through WebSocket connections:

```typescript
const useWebSocket = () => {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'PRICE_UPDATE':
          dispatch(updateMarketPrice(data.payload));
          break;
        case 'ORDER_UPDATE':
          dispatch(updateOrder(data.payload));
          break;
        case 'POSITION_UPDATE':
          dispatch(updatePosition(data.payload));
          break;
      }
    };
    
    return () => ws.close();
  }, [dispatch]);
};
```

### Live Data Components

Components that display real-time data use custom hooks for WebSocket integration and automatic updates.

## 🧪 Testing

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: User interaction and API integration testing
- **E2E Tests**: Complete user workflows
- **Visual Regression Tests**: UI consistency testing
- **Performance Tests**: Bundle size and runtime performance

### Test Examples

```typescript
// Component unit test
describe('OrderTicket', () => {
  it('should submit order with correct data', async () => {
    const mockSubmit = jest.fn();
    render(<OrderTicket onSubmit={mockSubmit} />);
    
    await user.type(screen.getByLabelText('Quantity'), '100');
    await user.type(screen.getByLabelText('Price'), '50.00');
    await user.click(screen.getByText('Buy'));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      side: 'buy',
      quantity: 100,
      price: 50.00,
    });
  });
});

// E2E test
describe('Trading Flow', () => {
  it('should complete full trading workflow', () => {
    cy.login('trader@example.com', 'password');
    cy.visit('/trading');
    
    cy.get('[data-testid="order-ticket"]').within(() => {
      cy.get('[name="quantity"]').type('100');
      cy.get('[name="price"]').type('50.00');
      cy.get('[data-testid="buy-button"]').click();
    });
    
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
    cy.get('[data-testid="positions-grid"]').should('contain', '100');
  });
});
```

## 📱 Responsive Design

The application is designed to work across all device sizes:

- **Desktop**: Full trading interface with multiple panels
- **Tablet**: Condensed interface with swipeable tabs
- **Mobile**: Single-panel interface with bottom navigation

### Breakpoints
```typescript
const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};
```

## 🔒 Security

### Client-side Security Measures
- **JWT Token Management**: Secure token storage and refresh
- **Route Protection**: Authentication-based route guards
- **Input Validation**: Form validation and sanitization
- **XSS Protection**: Content Security Policy implementation
- **Secure Communications**: HTTPS enforcement

### Trading Security
- **Order Confirmation**: Multi-step confirmation for large orders
- **Session Management**: Automatic session timeout
- **Audit Logging**: Client-side action logging
- **Error Handling**: Secure error messages without sensitive data exposure

## 🚀 Performance Optimization

### Optimization Techniques
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: For large data sets
- **Image Optimization**: Compressed and responsive images
- **Bundle Analysis**: Regular bundle size monitoring

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS monitoring
- **Custom Metrics**: Trading-specific performance metrics
- **Error Tracking**: Real-time error monitoring
- **User Analytics**: Usage pattern analysis

## 📚 Documentation

### Storybook Components
Component documentation and testing is available through Storybook:

```bash
npm run storybook
```

### Type Documentation
TypeScript interfaces and types are documented inline and available through IDE intellisense.

## 🔧 Build and Deployment

### Production Build
```bash
npm run build
```

The build process:
1. TypeScript compilation
2. Asset optimization
3. Code splitting
4. Service worker generation
5. Bundle analysis

### Docker Deployment
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

### Development Guidelines
- Follow TypeScript strict mode
- Use functional components with hooks
- Maintain 80%+ test coverage
- Follow Material-UI design principles
- Use semantic commit messages

### Code Standards
- ESLint configuration for consistent code style
- Prettier for code formatting
- Husky pre-commit hooks for quality gates
- Component prop validation with TypeScript

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.