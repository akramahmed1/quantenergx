import { configureStore } from '@reduxjs/toolkit';
import marketReducer, { fetchMarketData, clearError, updateQuote } from '../store/slices/marketSlice';

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      market: marketReducer,
    },
  });
};

describe('marketSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should return initial state', () => {
    const state = store.getState().market;
    expect(state.marketData).toEqual({});
    expect(state.analytics).toEqual({});
    expect(state.quotes).toEqual({});
    expect(state.loading.marketData).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle clearError action', () => {
    // First set an error
    store.dispatch({ type: 'market/fetchMarketData/rejected', error: { message: 'Test error' } });
    expect(store.getState().market.error).toBe('Test error');

    // Then clear it
    store.dispatch(clearError());
    expect(store.getState().market.error).toBe(null);
  });

  it('should handle updateQuote action', () => {
    const quote = {
      symbol: 'CL',
      price: 80.5,
      change: 1.2,
      changePercent: 1.5,
      volume: 100000,
    };

    // First add a quote to state
    store.dispatch({
      type: 'market/fetchQuotes/fulfilled',
      payload: [{
        symbol: 'CL',
        commodity: 'crude_oil',
        price: 79.3,
        change: 0,
        changePercent: 0,
        volume: 50000,
        timestamp: new Date().toISOString(),
      }],
    });

    // Then update it
    store.dispatch(updateQuote(quote));
    
    const state = store.getState().market;
    expect(state.quotes.CL.price).toBe(80.5);
    expect(state.quotes.CL.change).toBe(1.2);
    expect(state.quotes.CL.changePercent).toBe(1.5);
    expect(state.quotes.CL.volume).toBe(100000);
  });

  it('should handle fetchMarketData pending', () => {
    store.dispatch({ type: fetchMarketData.pending.type });
    
    const state = store.getState().market;
    expect(state.loading.marketData).toBe(true);
    expect(state.error).toBe(null);
  });

  it('should handle fetchMarketData fulfilled', () => {
    const marketData = {
      commodity: 'crude_oil',
      symbol: 'CL',
      timeframe: '1D',
      data: [
        {
          timestamp: '2024-01-01T00:00:00Z',
          open: 80.0,
          high: 81.0,
          low: 79.5,
          close: 80.5,
          volume: 100000,
        },
      ],
      metadata: {
        source: 'test',
        unit: 'barrel',
        currency: 'USD',
        lastUpdate: '2024-01-01T00:00:00Z',
      },
    };

    store.dispatch({
      type: fetchMarketData.fulfilled.type,
      payload: marketData,
    });
    
    const state = store.getState().market;
    expect(state.loading.marketData).toBe(false);
    expect(state.marketData[`${marketData.commodity}_${marketData.symbol}_${marketData.timeframe}`]).toEqual(marketData);
  });

  it('should handle fetchMarketData rejected', () => {
    const errorMessage = 'Failed to fetch market data';
    
    store.dispatch({
      type: fetchMarketData.rejected.type,
      error: { message: errorMessage },
    });
    
    const state = store.getState().market;
    expect(state.loading.marketData).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
});