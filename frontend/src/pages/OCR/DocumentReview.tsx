import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Grid, TextField, Button, Divider, Alert } from '@mui/material';

export const OCRDocumentReview: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Document Review
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Document ID: {documentId} - This is a placeholder for the document review interface. Full
        implementation would include extracted text display, field editing, and approval workflow.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Extracted Text
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, minHeight: 200 }}>
              <Typography variant="body2" color="text.secondary">
                OCR extracted text would appear here...
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Extracted Fields
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Contract Number" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Trade Date" type="date" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Volume" />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Price" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Counterparty" />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="contained" color="success">
                Approve
              </Button>
              <Button variant="outlined" color="warning">
                Needs Revision
              </Button>
              <Button variant="outlined" color="error">
                Reject
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
