import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

export const RiskDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Risk Dashboard
      </Typography>
      <Alert severity="info">
        Risk dashboard implementation pending. This will include VaR calculations, 
        position limits, stress testing, and risk metrics visualization.
      </Alert>
    </Box>
  );
};