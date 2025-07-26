import { configureStore } from '@reduxjs/toolkit';
import ocrReducer from './slices/ocrSlice';
import tradingReducer from './slices/tradingSlice';
import riskReducer from './slices/riskSlice';
import complianceReducer from './slices/complianceSlice';
import marketReducer from './slices/marketSlice';
import authReducer from './slices/authSlice';
import notificationReducer from './slices/notificationSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    ocr: ocrReducer,
    trading: tradingReducer,
    risk: riskReducer,
    compliance: complianceReducer,
    market: marketReducer,
    auth: authReducer,
    notifications: notificationReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
