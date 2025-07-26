import { createSlice } from '@reduxjs/toolkit';

interface RiskState {
  metrics: any;
  limits: any[];
  alerts: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RiskState = {
  metrics: null,
  limits: [],
  alerts: [],
  isLoading: false,
  error: null,
};

const riskSlice = createSlice({
  name: 'risk',
  initialState,
  reducers: {
    // Risk reducers will be implemented later
  },
});

export default riskSlice.reducer;
