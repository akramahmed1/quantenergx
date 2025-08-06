import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface MarketDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  commodity: string;
  symbol: string;
  timeframe: string;
  data: MarketDataPoint[];
  metadata: {
    source: string;
    unit: string;
    currency: string;
    lastUpdate: string;
  };
}

export interface Analytics {
  commodity: string;
  period: string;
  timestamp: string;
  analytics: {
    symbols: string[];
    price: {
      current: number;
      average: number;
      min: number;
      max: number;
      changePercent: number;
    };
    volume: {
      total: number;
      average: number;
    };
    volatility: number;
  };
  trends: {
    direction: 'bullish' | 'bearish' | 'sideways';
    strength: 'weak' | 'moderate' | 'strong';
    changePercent: number;
    support: number;
    resistance: number;
    volatilityRegime: 'low' | 'medium' | 'high';
  };
  correlations: Record<string, number>;
  volatilityMetrics: {
    current: number;
    percentile: number;
    regime: 'low' | 'medium' | 'high';
    garchForecast: number;
    impliedVolatility: number;
  };
  seasonality: {
    currentSeason: string;
    seasonalBias: 'bullish' | 'bearish' | 'neutral';
    historicalSeasonalReturn: number;
    daysToSeasonEnd: number | null;
  };
}

export interface MarketState {
  marketData: Record<string, MarketData>;
  analytics: Record<string, Analytics>;
  quotes: Record<
    string,
    {
      symbol: string;
      commodity: string;
      price: number;
      change: number;
      changePercent: number;
      volume: number;
      timestamp: string;
    }
  >;
  supportedCommodities: Record<
    string,
    {
      symbols: string[];
      unit: string;
      currency: string;
      exchanges: string[];
      contracts: string[];
    }
  >;
  loading: {
    marketData: boolean;
    analytics: boolean;
    quotes: boolean;
  };
  error: string | null;
}

const initialState: MarketState = {
  marketData: {},
  analytics: {},
  quotes: {},
  supportedCommodities: {},
  loading: {
    marketData: false,
    analytics: false,
    quotes: false,
  },
  error: null,
};

// Async thunks
export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async ({
    commodity,
    symbol,
    timeframe,
  }: {
    commodity: string;
    symbol?: string;
    timeframe?: string;
  }) => {
    const response = await fetch(
      `${API_URL}/api/v1/market/prices/${commodity}?symbol=${symbol}&timeframe=${timeframe}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }
    const data = await response.json();
    return data.marketData;
  }
);

export const fetchAnalytics = createAsyncThunk(
  'market/fetchAnalytics',
  async ({ commodity, period }: { commodity: string; period?: string }) => {
    const response = await fetch(`${API_URL}/api/v1/market/analytics/${commodity}?period=${period}`);
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    const data = await response.json();
    return data.analytics;
  }
);

export const fetchQuotes = createAsyncThunk('market/fetchQuotes', async (symbols: string[]) => {
  const response = await fetch(`${API_URL}/api/v1/market/quotes?symbols=${symbols.join(',')}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quotes');
  }
  const data = await response.json();
  return data.quotes;
});

export const fetchSupportedCommodities = createAsyncThunk(
  'market/fetchSupportedCommodities',
  async () => {
    const response = await fetch(`${API_URL}/api/v1/market/commodities`);
    if (!response.ok) {
      throw new Error('Failed to fetch supported commodities');
    }
    const data = await response.json();
    return data.commodities;
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    updateQuote: (
      state,
      action: PayloadAction<{
        symbol: string;
        price: number;
        change: number;
        changePercent: number;
        volume: number;
      }>
    ) => {
      const { symbol, price, change, changePercent, volume } = action.payload;
      if (state.quotes[symbol]) {
        state.quotes[symbol] = {
          ...state.quotes[symbol],
          price,
          change,
          changePercent,
          volume,
          timestamp: new Date().toISOString(),
        };
      }
    },
  },
  extraReducers: builder => {
    builder
      // Market data
      .addCase(fetchMarketData.pending, state => {
        state.loading.marketData = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading.marketData = false;
        const marketData = action.payload;
        const key = `${marketData.commodity}_${marketData.symbol}_${marketData.timeframe}`;
        state.marketData[key] = marketData;
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading.marketData = false;
        state.error = action.error.message || 'Failed to fetch market data';
      })
      // Analytics
      .addCase(fetchAnalytics.pending, state => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        const analytics = action.payload;
        state.analytics[analytics.commodity] = analytics;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = action.error.message || 'Failed to fetch analytics';
      })
      // Quotes
      .addCase(fetchQuotes.pending, state => {
        state.loading.quotes = true;
        state.error = null;
      })
      .addCase(fetchQuotes.fulfilled, (state, action) => {
        state.loading.quotes = false;
        const quotes = action.payload;
        quotes.forEach((quote: any) => {
          if (!quote.error) {
            state.quotes[quote.symbol] = quote;
          }
        });
      })
      .addCase(fetchQuotes.rejected, (state, action) => {
        state.loading.quotes = false;
        state.error = action.error.message || 'Failed to fetch quotes';
      })
      // Supported commodities
      .addCase(fetchSupportedCommodities.fulfilled, (state, action) => {
        state.supportedCommodities = action.payload;
      });
  },
});

export const { clearError, updateQuote } = marketSlice.actions;
export default marketSlice.reducer;
