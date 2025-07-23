/*
 * Copyright (c) 2025 QuantEnerGx Technologies
 * 
 * Patent Pending - All Rights Reserved
 * 
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, or use of this software is strictly prohibited and may
 * be punishable by law. This software contains trade secrets and 
 * proprietary technology protected by copyright, patent, and trade 
 * secret laws.
 * 
 * Energy Industry Compliance: This software complies with relevant
 * energy industry standards including NERC CIP, IEC 61850, and
 * applicable cybersecurity frameworks for critical infrastructure.
 * 
 * SaaS Security: Implements industry-standard security practices
 * including OAuth2, JWT authentication, data encryption at rest
 * and in transit, and GDPR/CCPA compliance measures.
 * 
 * For licensing inquiries, contact: legal@quantenergx.com
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import App from './App';
import './i18n';

// Create energy industry themed design system
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Energy blue
      dark: '#115293',
      light: '#42a5f5',
    },
    secondary: {
      main: '#388e3c', // Renewable green
      dark: '#2e7d32',
      light: '#66bb6a',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    error: {
      main: '#d32f2f', // Critical alert red
    },
    warning: {
      main: '#f57c00', // Warning amber
    },
    success: {
      main: '#388e3c', // Success green
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);