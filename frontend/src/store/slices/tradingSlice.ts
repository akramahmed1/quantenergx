import { createSlice } from '@reduxjs/toolkit';

interface TradingState {
  orders: any[];
  positions: any[];
  portfolio: any;
  isLoading: boolean;
  error: string | null;
}

const initialState: TradingState = {
  orders: [],
  positions: [],
  portfolio: null,
  isLoading: false,
  error: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    // Trading reducers will be implemented later
  },
});

export default tradingSlice.reducer;
