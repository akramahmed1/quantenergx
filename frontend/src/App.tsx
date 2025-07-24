import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import { AppBar } from './components/Layout/AppBar';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { OCRDocumentUpload } from './pages/OCR/DocumentUpload';
import { OCRDocumentReview } from './pages/OCR/DocumentReview';
import { OCRBatchStatus } from './pages/OCR/BatchStatus';
import { TradingDashboard } from './pages/Trading/Dashboard';
import { RiskDashboard } from './pages/Risk/Dashboard';
import { ComplianceDashboard } from './pages/Compliance/Dashboard';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          mt: 8, // Account for AppBar height
          ml: 30, // Account for Sidebar width
        }}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ocr/upload" element={<OCRDocumentUpload />} />
          <Route path="/ocr/review/:documentId" element={<OCRDocumentReview />} />
          <Route path="/ocr/batch/:batchId" element={<OCRBatchStatus />} />
          <Route path="/trading" element={<TradingDashboard />} />
          <Route path="/risk" element={<RiskDashboard />} />
          <Route path="/compliance" element={<ComplianceDashboard />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;