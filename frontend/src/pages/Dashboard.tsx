import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import {
  TrendingUp as TrendingIcon,
  DocumentScanner as OCRIcon,
  Security as RiskIcon,
  Gavel as ComplianceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Upload Documents',
      description: 'Upload trading documents for OCR processing',
      icon: <OCRIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/ocr/upload'),
      color: 'primary.main',
    },
    {
      title: 'Trading Dashboard',
      description: 'View live trading positions and market data',
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/trading'),
      color: 'success.main',
    },
    {
      title: 'Risk Management',
      description: 'Monitor risk metrics and compliance',
      icon: <RiskIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/risk'),
      color: 'warning.main',
    },
    {
      title: 'Compliance Center',
      description: 'Audit trails and regulatory reporting',
      icon: <ComplianceIcon sx={{ fontSize: 40 }} />,
      action: () => navigate('/compliance'),
      color: 'info.main',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        QuantEnergx Dashboard
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the QuantEnergx energy trading platform with advanced OCR and document processing
        capabilities.
      </Typography>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={action.action}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: action.color, mb: 2 }}>{action.icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary">
              No recent activity. Upload your first document to get started.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/ocr/upload')}>
              Upload Document
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
