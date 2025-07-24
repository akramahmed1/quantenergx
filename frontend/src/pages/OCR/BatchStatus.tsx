import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';

export const OCRBatchStatus: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();

  // Mock data for demonstration
  const batchData = {
    batch_id: batchId,
    total_documents: 5,
    completed: 3,
    failed: 1,
    processing: 1,
    waiting: 0,
    results: [
      { document_id: '1', filename: 'contract_001.pdf', status: 'completed', confidence: 95 },
      { document_id: '2', filename: 'invoice_002.jpg', status: 'completed', confidence: 87 },
      { document_id: '3', filename: 'receipt_003.png', status: 'processing', confidence: 0 },
      { document_id: '4', filename: 'document_004.pdf', status: 'failed', confidence: 0 },
      { document_id: '5', filename: 'scan_005.tiff', status: 'completed', confidence: 92 },
    ],
  };

  const progress = (batchData.completed / batchData.total_documents) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Batch Processing Status
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Batch ID: {batchId}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {batchData.completed} of {batchData.total_documents} documents processed ({progress.toFixed(0)}%)
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`Completed: ${batchData.completed}`} color="success" />
          <Chip label={`Processing: ${batchData.processing}`} color="warning" />
          <Chip label={`Failed: ${batchData.failed}`} color="error" />
          <Chip label={`Waiting: ${batchData.waiting}`} color="default" />
        </Box>
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document ID</TableCell>
                <TableCell>Filename</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Confidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batchData.results.map((result) => (
                <TableRow key={result.document_id}>
                  <TableCell>{result.document_id}</TableCell>
                  <TableCell>{result.filename}</TableCell>
                  <TableCell>
                    <Chip 
                      label={result.status} 
                      color={getStatusColor(result.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {result.confidence > 0 ? `${result.confidence}%` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};