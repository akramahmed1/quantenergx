import { createSlice } from '@reduxjs/toolkit';

interface ComplianceState {
  auditTrail: any[];
  reports: any[];
  violations: any[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ComplianceState = {
  auditTrail: [],
  reports: [],
  violations: [],
  isLoading: false,
  error: null,
};

const complianceSlice = createSlice({
  name: 'compliance',
  initialState,
  reducers: {
    // Compliance reducers will be implemented later
  },
});

export default complianceSlice.reducer;
