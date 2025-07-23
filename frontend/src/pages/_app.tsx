/*
QuantEnergX MVP - Main Application Component
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

Root application component with authentication context, i18n setup,
and global state management for the energy trading platform.
*/

'use client';

import React from 'react';
import { appWithTranslation } from 'next-i18next';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/globals.css';

interface AppProps {
  Component: React.ComponentType;
  pageProps: any;
}

function QuantEnergXApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

// Enable i18n for the app
export default appWithTranslation(QuantEnergXApp);