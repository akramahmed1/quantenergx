import { configureStore } from '@reduxjs/toolkit';
import tradingSlice, {
  placeOrder,
  cancelOrder,
  updateOrderStatus,
  addPosition,
  updatePosition,
  setMarketData,
  initialState,
} from '../store/slices/tradingSlice';

describe('tradingSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        trading: tradingSlice,
      },
    });
  });

  describe('initial state', () => {
    test('should have correct initial state', () => {
      const state = store.getState().trading;

      expect(state.orders).toEqual([]);
      expect(state.positions).toEqual([]);
      expect(state.marketData).toEqual({});
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastTradePrice).toBeNull();
      expect(state.totalPortfolioValue).toBe(0);
    });
  });

  describe('placeOrder action', () => {
    test('should handle placeOrder.pending', () => {
      const action = { type: placeOrder.pending.type };
      const state = tradingSlice(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    test('should handle placeOrder.fulfilled', () => {
      const orderData = {
        id: 'order-123',
        symbol: 'CRUDE_OIL',
        side: 'buy',
        quantity: 100,
        price: 75.5,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };

      const action = {
        type: placeOrder.fulfilled.type,
        payload: orderData,
      };
      const state = tradingSlice(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.orders).toHaveLength(1);
      expect(state.orders[0]).toEqual(orderData);
    });

    test('should handle placeOrder.rejected', () => {
      const errorMessage = 'Insufficient margin';
      const action = {
        type: placeOrder.rejected.type,
        error: { message: errorMessage },
      };
      const state = tradingSlice(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('cancelOrder action', () => {
    test('should handle cancelOrder.fulfilled', () => {
      const initialStateWithOrder = {
        ...initialState,
        orders: [
          {
            id: 'order-123',
            symbol: 'CRUDE_OIL',
            side: 'buy',
            quantity: 100,
            price: 75.5,
            status: 'pending',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const action = {
        type: cancelOrder.fulfilled.type,
        payload: { orderId: 'order-123' },
      };
      const state = tradingSlice(initialStateWithOrder, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.orders[0].status).toBe('cancelled');
    });

    test('should handle cancelOrder.rejected', () => {
      const errorMessage = 'Order not found';
      const action = {
        type: cancelOrder.rejected.type,
        error: { message: errorMessage },
      };
      const state = tradingSlice(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('updateOrderStatus action', () => {
    test('should update order status correctly', () => {
      const initialStateWithOrder = {
        ...initialState,
        orders: [
          {
            id: 'order-123',
            symbol: 'CRUDE_OIL',
            side: 'buy',
            quantity: 100,
            price: 75.5,
            status: 'pending',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const action = updateOrderStatus({
        orderId: 'order-123',
        status: 'filled',
        fillPrice: 75.45,
        fillQuantity: 100,
      });
      const state = tradingSlice(initialStateWithOrder, action);

      expect(state.orders[0].status).toBe('filled');
      expect(state.orders[0].fillPrice).toBe(75.45);
      expect(state.orders[0].fillQuantity).toBe(100);
      expect(state.lastTradePrice).toBe(75.45);
    });

    test('should not update non-existent order', () => {
      const action = updateOrderStatus({
        orderId: 'non-existent',
        status: 'filled',
        fillPrice: 75.45,
        fillQuantity: 100,
      });
      const state = tradingSlice(initialState, action);

      expect(state.orders).toHaveLength(0);
      expect(state.lastTradePrice).toBeNull();
    });
  });

  describe('position management', () => {
    test('should add new position', () => {
      const positionData = {
        symbol: 'CRUDE_OIL',
        quantity: 100,
        averagePrice: 75.5,
        currentPrice: 76.0,
        unrealizedPnL: 50,
        realizedPnL: 0,
      };

      const action = addPosition(positionData);
      const state = tradingSlice(initialState, action);

      expect(state.positions).toHaveLength(1);
      expect(state.positions[0]).toEqual(positionData);
    });

    test('should update existing position', () => {
      const initialStateWithPosition = {
        ...initialState,
        positions: [
          {
            symbol: 'CRUDE_OIL',
            quantity: 100,
            averagePrice: 75.5,
            currentPrice: 76.0,
            unrealizedPnL: 50,
            realizedPnL: 0,
          },
        ],
      };

      const updateData = {
        symbol: 'CRUDE_OIL',
        currentPrice: 77.0,
        unrealizedPnL: 150,
      };

      const action = updatePosition(updateData);
      const state = tradingSlice(initialStateWithPosition, action);

      expect(state.positions[0].currentPrice).toBe(77.0);
      expect(state.positions[0].unrealizedPnL).toBe(150);
      expect(state.positions[0].quantity).toBe(100); // Should remain unchanged
    });

    test('should calculate total portfolio value', () => {
      const initialStateWithPositions = {
        ...initialState,
        positions: [
          {
            symbol: 'CRUDE_OIL',
            quantity: 100,
            averagePrice: 75.5,
            currentPrice: 76.0,
            unrealizedPnL: 50,
            realizedPnL: 0,
          },
          {
            symbol: 'NATURAL_GAS',
            quantity: 200,
            averagePrice: 3.25,
            currentPrice: 3.3,
            unrealizedPnL: 10,
            realizedPnL: 15,
          },
        ],
      };

      // The reducer should calculate total portfolio value
      const action = { type: 'trading/calculatePortfolioValue' };
      const state = tradingSlice(initialStateWithPositions, action);

      // Total value should be sum of all position values
      const expectedValue = 100 * 76.0 + 200 * 3.3;
      expect(state.totalPortfolioValue).toBe(expectedValue);
    });
  });

  describe('market data management', () => {
    test('should set market data for multiple symbols', () => {
      const marketData = {
        CRUDE_OIL: {
          price: 76.5,
          change: 1.25,
          changePercent: 1.66,
          volume: 1500000,
          timestamp: new Date().toISOString(),
        },
        NATURAL_GAS: {
          price: 3.45,
          change: -0.05,
          changePercent: -1.43,
          volume: 2500000,
          timestamp: new Date().toISOString(),
        },
      };

      const action = setMarketData(marketData);
      const state = tradingSlice(initialState, action);

      expect(state.marketData).toEqual(marketData);
    });

    test('should update existing market data', () => {
      const initialMarketData = {
        CRUDE_OIL: {
          price: 75.0,
          change: 0.5,
          changePercent: 0.67,
          volume: 1000000,
          timestamp: new Date().toISOString(),
        },
      };

      const initialStateWithMarketData = {
        ...initialState,
        marketData: initialMarketData,
      };

      const newMarketData = {
        CRUDE_OIL: {
          price: 76.5,
          change: 1.25,
          changePercent: 1.66,
          volume: 1500000,
          timestamp: new Date().toISOString(),
        },
      };

      const action = setMarketData(newMarketData);
      const state = tradingSlice(initialStateWithMarketData, action);

      expect(state.marketData.CRUDE_OIL.price).toBe(76.5);
      expect(state.marketData.CRUDE_OIL.change).toBe(1.25);
    });
  });

  describe('error handling', () => {
    test('should clear error when new action starts', () => {
      const stateWithError = {
        ...initialState,
        error: 'Previous error',
        loading: false,
      };

      const action = { type: placeOrder.pending.type };
      const state = tradingSlice(stateWithError, action);

      expect(state.error).toBeNull();
      expect(state.loading).toBe(true);
    });

    test('should handle multiple errors properly', () => {
      let state = tradingSlice(initialState, {
        type: placeOrder.rejected.type,
        error: { message: 'First error' },
      });

      expect(state.error).toBe('First error');

      state = tradingSlice(state, {
        type: cancelOrder.rejected.type,
        error: { message: 'Second error' },
      });

      expect(state.error).toBe('Second error');
    });
  });

  describe('order filtering and sorting', () => {
    test('should maintain order chronological order', () => {
      let state = initialState;

      const order1 = {
        id: 'order-1',
        symbol: 'CRUDE_OIL',
        side: 'buy',
        quantity: 100,
        price: 75.5,
        status: 'pending',
        timestamp: '2023-01-01T10:00:00Z',
      };

      const order2 = {
        id: 'order-2',
        symbol: 'NATURAL_GAS',
        side: 'sell',
        quantity: 200,
        price: 3.25,
        status: 'pending',
        timestamp: '2023-01-01T11:00:00Z',
      };

      state = tradingSlice(state, {
        type: placeOrder.fulfilled.type,
        payload: order1,
      });

      state = tradingSlice(state, {
        type: placeOrder.fulfilled.type,
        payload: order2,
      });

      expect(state.orders).toHaveLength(2);
      expect(state.orders[0].id).toBe('order-1');
      expect(state.orders[1].id).toBe('order-2');
    });
  });

  describe('real-time updates integration', () => {
    test('should handle real-time price updates', () => {
      const initialStateWithData = {
        ...initialState,
        marketData: {
          CRUDE_OIL: {
            price: 75.0,
            change: 0.5,
            changePercent: 0.67,
            volume: 1000000,
            timestamp: new Date().toISOString(),
          },
        },
        positions: [
          {
            symbol: 'CRUDE_OIL',
            quantity: 100,
            averagePrice: 75.5,
            currentPrice: 75.0,
            unrealizedPnL: -50,
            realizedPnL: 0,
          },
        ],
      };

      const priceUpdate = {
        CRUDE_OIL: {
          price: 76.0,
          change: 1.0,
          changePercent: 1.33,
          volume: 1200000,
          timestamp: new Date().toISOString(),
        },
      };

      const action = setMarketData(priceUpdate);
      const state = tradingSlice(initialStateWithData, action);

      expect(state.marketData.CRUDE_OIL.price).toBe(76.0);

      // Position should be updated with new current price
      const updatedPosition = updatePosition({
        symbol: 'CRUDE_OIL',
        currentPrice: 76.0,
        unrealizedPnL: 50, // (76.00 - 75.50) * 100
      });

      const finalState = tradingSlice(state, updatedPosition);
      expect(finalState.positions[0].currentPrice).toBe(76.0);
      expect(finalState.positions[0].unrealizedPnL).toBe(50);
    });
  });
});
