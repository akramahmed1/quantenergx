import { configureStore } from '@reduxjs/toolkit';
import ocrReducer from './slices/ocrSlice';
import tradingReducer from './slices/tradingSlice';
import riskReducer from './slices/riskSlice';
import complianceReducer from './slices/complianceSlice';

export const store = configureStore({
  reducer: {
    ocr: ocrReducer,
    trading: tradingReducer,
    risk: riskReducer,
    compliance: complianceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;