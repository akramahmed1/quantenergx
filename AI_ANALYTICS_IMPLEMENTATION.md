# AI Analytics Features for Oil & Gas Trading

## Overview

This implementation provides TensorFlow-based AI analytics for Brent-WTI spread prediction and anomaly detection, specifically designed to detect price manipulation and provide trading insights for oil & gas markets.

## Components

### Backend Service: `services/analytics/brent-wti.ts`

**Purpose**: TensorFlow-based analytics service for oil price spread analysis

**Key Features**:
- Brent-WTI spread prediction using LSTM-like neural networks
- Anomaly detection using autoencoder architecture
- Benchmark comparison with major trading houses (Vitol, Trafigura)
- Market regime identification (normal, contango, backwardation, volatile)
- Price manipulation detection with severity classification

**API Structure**:
```typescript
class BrentWTIAnalyticsService {
  // Core prediction methods
  async predictSpread(data, forecastHorizon): Promise<SpreadPrediction[]>
  async detectAnomalies(data, benchmarkData): Promise<AnomalyDetection[]>
  async generateAnalyticsDashboard(data, benchmarkData): Promise<AnalyticsDashboard>
  
  // Utility methods
  generateMockData(count): BrentWTIDataPoint[]
  getServiceHealth(): ServiceHealth
  dispose(): void
}
```

### Frontend Component: `components/OilArbitrageChart.tsx`

**Purpose**: Interactive React component for visualizing oil arbitrage analytics

**Key Features**:
- Real-time spread visualization with AI predictions
- Benchmark overlays from major trading houses
- Anomaly detection markers with severity indicators
- Volume analysis charts
- Responsive design for mobile and desktop
- Export capabilities for reporting

**Props Interface**:
```typescript
interface OilArbitrageChartProps {
  userId?: string;
  height?: number;
  refreshInterval?: number;
  showBenchmarks?: boolean;
  showAnomalies?: boolean;
  compactMode?: boolean;
}
```

## Current Implementation Status

### ✅ Completed Features

1. **TensorFlow Integration**
   - Added `@tensorflow/tfjs-node` and `@tensorflow/tfjs` dependencies
   - Placeholder model architecture (LSTM for prediction, autoencoder for anomaly detection)
   - Mock model initialization and inference

2. **Data Processing Pipeline**
   - Feature engineering with technical indicators (SMA, RSI, MACD, Bollinger Bands)
   - Time-series data normalization and scaling
   - Market microstructure analysis

3. **Anomaly Detection**
   - Statistical anomaly detection (Z-score, IQR, Modified Z-score)
   - Pattern-based anomalies (seasonal breaks, trend reversals, volatility spikes)
   - Correlation anomalies between Brent and WTI
   - Benchmark comparison for manipulation detection

4. **Interactive Visualization**
   - Plotly-based interactive charts with zoom, pan, and hover
   - Multi-tab interface (Spread Analysis, Volume Analysis)
   - Real-time data refresh capabilities
   - Responsive Material-UI design

5. **Mock Data Integration**
   - Comprehensive mock data generators for development
   - Realistic price correlations and market dynamics
   - Simulated benchmark data from major trading houses

### 🔧 Extension Points (TODO Comments)

#### Backend Extensions

1. **Model Loading & Training**
   ```typescript
   // TODO: Replace with actual model loading from persistent storage
   // Location: loadModels() method
   // Action: Load trained models from file system or cloud storage
   ```

2. **Real Market Data Integration**
   ```typescript
   // TODO: Replace with real market data integration
   // Location: getCurrentMarketData() method
   // Action: Connect to Bloomberg, Refinitiv, or other market data providers
   ```

3. **Model Training Pipeline**
   ```typescript
   // TODO: Implement actual model training pipeline
   // Location: Throughout service initialization
   // Action: Add training scripts, data preprocessing, model validation
   ```

4. **API Endpoints**
   ```typescript
   // TODO: Create REST API endpoints for frontend integration
   // Location: New route files needed
   // Action: Add Express routes for predictions, anomalies, dashboard data
   ```

#### Frontend Extensions

1. **API Integration**
   ```typescript
   // TODO: Replace with actual API calls to backend analytics service
   // Location: fetchAnalyticsData() method
   // Action: Implement HTTP client for backend communication
   ```

2. **Real-time Data Streaming**
   ```typescript
   // TODO: Implement WebSocket integration for real-time updates
   // Location: useEffect hooks
   // Action: Connect to WebSocket server for live data
   ```

3. **Authentication Integration**
   ```typescript
   // TODO: Add authentication and authorization
   // Location: Throughout component
   // Action: Integrate with existing auth system
   ```

## Technical Architecture

### Data Flow
```
Market Data Sources → Analytics Service → AI Models → Predictions/Anomalies → Frontend Charts
                          ↓
                    Benchmark APIs → Comparison Engine → Manipulation Detection
```

### Model Architecture
- **Prediction Model**: Sequential LSTM with dropout layers (64→32→16→1 units)
- **Anomaly Model**: Autoencoder with compression (20→12→6→12→20 units)
- **Feature Engineering**: 24 features including prices, technical indicators, volumes, external factors

### Chart Configuration
- **Main Chart**: Time-series plot with multiple traces (actual, predicted, benchmarks, anomalies)
- **Volume Chart**: Comparative bar chart for Brent vs WTI trading volumes
- **Interactive Features**: Zoom, pan, hover tooltips, export options

## Installation & Usage

### Dependencies Added
```json
{
  "@tensorflow/tfjs-node": "^4.x.x",
  "@tensorflow/tfjs": "^4.x.x"
}
```

### Basic Usage

#### Backend Service
```typescript
import { BrentWTIAnalyticsService } from './services/analytics/brent-wti';

const analyticsService = new BrentWTIAnalyticsService();

// Generate predictions
const data = analyticsService.generateMockData(100);
const predictions = await analyticsService.predictSpread(data, 24);

// Detect anomalies
const benchmarks = { vitol_spread: 3.2, trafigura_spread: 3.1, market_consensus: 3.15 };
const anomalies = await analyticsService.detectAnomalies(data, benchmarks);
```

#### Frontend Component
```typescript
import OilArbitrageChart from './components/OilArbitrageChart';

// Basic usage
<OilArbitrageChart />

// Advanced usage
<OilArbitrageChart
  userId="trader123"
  height={800}
  refreshInterval={30000}
  showBenchmarks={true}
  showAnomalies={true}
/>
```

## Future Enhancements

### Phase 1: Real Data Integration
- Connect to market data providers (Bloomberg, Refinitiv)
- Implement real-time data streaming
- Add authentication and user management

### Phase 2: Advanced AI Models
- Train models on historical data
- Implement ensemble methods
- Add reinforcement learning for portfolio optimization

### Phase 3: Production Features
- Add comprehensive error handling and logging
- Implement caching and performance optimization
- Add unit and integration tests
- Create deployment scripts

### Phase 4: Advanced Analytics
- Add more commodities (natural gas, refined products)
- Implement cross-commodity arbitrage detection
- Add ESG scoring and carbon trading analytics

## Development Notes

### Code Quality
- TypeScript interfaces for type safety
- Comprehensive error handling with try-catch blocks
- Modular architecture for easy testing and maintenance
- Clear separation of concerns (data, models, visualization)

### Performance Considerations
- Memoized chart components to prevent unnecessary re-renders
- Efficient data processing with streaming-friendly algorithms
- TensorFlow.js optimization for browser/Node.js environments

### Security
- Input validation for all data processing
- Secure API endpoints (to be implemented)
- No sensitive data in client-side code

## Testing

The implementation includes a validation script (`validate-ai-analytics.js`) that tests:
- File structure and code organization
- Mock data generation functionality
- Technical indicator calculations
- Chart configuration and rendering
- Extension point documentation

Run validation: `node backend/validate-ai-analytics.js`

## Conclusion

This implementation provides a solid foundation for AI-driven oil & gas trading analytics with clear extension points for production deployment. The architecture supports both development with mock data and future integration with real market data sources.