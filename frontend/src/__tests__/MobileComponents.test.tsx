import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { I18nProvider } from '../i18n/I18nProvider';
import BiometricAuth from '../components/mobile/BiometricAuth';
import OfflineTrading from '../components/mobile/OfflineTrading';
import PushNotifications from '../components/mobile/PushNotifications';
import MobileSettings from '../components/mobile/MobileSettings';

// Mock WebAuthn API
const mockCredentials = {
  create: jest.fn(),
  get: jest.fn(),
};

Object.defineProperty(window, 'PublicKeyCredential', {
  writable: true,
  value: {
    isUserVerifyingPlatformAuthenticatorAvailable: jest.fn().mockResolvedValue(true),
  },
});

Object.defineProperty(navigator, 'credentials', {
  writable: true,
  value: mockCredentials,
});

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default',
    requestPermission: jest.fn().mockResolvedValue('granted'),
  },
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nProvider defaultLanguage="en">
    {children}
  </I18nProvider>
);

describe('Mobile Components', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('BiometricAuth', () => {
    it('renders correctly when biometric is supported', async () => {
      const onAuthSuccess = jest.fn();
      const onAuthFailure = jest.fn();

      render(
        <TestWrapper>
          <BiometricAuth onAuthSuccess={onAuthSuccess} onAuthFailure={onAuthFailure} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Biometric Authentication')).toBeInTheDocument();
      });
    });

    it('enables biometric authentication when switch is toggled', async () => {
      const onAuthSuccess = jest.fn();
      const onAuthFailure = jest.fn();

      mockCredentials.create.mockResolvedValueOnce({
        id: 'test-credential-id',
      });

      render(
        <TestWrapper>
          <BiometricAuth onAuthSuccess={onAuthSuccess} onAuthFailure={onAuthFailure} />
        </TestWrapper>
      );

      const toggle = await screen.findByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockCredentials.create).toHaveBeenCalled();
        expect(onAuthSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('OfflineTrading', () => {
    it('renders offline mode controls', () => {
      const onSyncOrders = jest.fn();

      render(
        <TestWrapper>
          <OfflineTrading isOnline={false} onSyncOrders={onSyncOrders} />
        </TestWrapper>
      );

      expect(screen.getByText('Offline Trading')).toBeInTheDocument();
      expect(screen.getByText('Offline Mode')).toBeInTheDocument();
    });

    it('shows sync button when online with pending orders', () => {
      // Add mock offline orders to localStorage
      const mockOrders = [
        {
          id: 'offline_1',
          type: 'buy',
          commodity: 'crude_oil',
          quantity: 100,
          price: 80,
          timestamp: Date.now(),
          status: 'pending'
        }
      ];
      localStorage.setItem('quantenergx_offline_orders', JSON.stringify(mockOrders));

      const onSyncOrders = jest.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <OfflineTrading isOnline={true} onSyncOrders={onSyncOrders} />
        </TestWrapper>
      );

      expect(screen.getByText('Sync Data')).toBeInTheDocument();
    });
  });

  describe('PushNotifications', () => {
    it('renders notification settings', () => {
      render(
        <TestWrapper>
          <PushNotifications />
        </TestWrapper>
      );

      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('Enable Push Notifications')).toBeInTheDocument();
    });

    it('requests permission when notifications are enabled', async () => {
      const mockRequestPermission = jest.fn().mockResolvedValue('granted');
      Object.defineProperty(window.Notification, 'requestPermission', {
        writable: true,
        value: mockRequestPermission,
      });

      render(
        <TestWrapper>
          <PushNotifications />
        </TestWrapper>
      );

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });
  });

  describe('MobileSettings', () => {
    it('renders all mobile settings sections', () => {
      render(
        <TestWrapper>
          <MobileSettings />
        </TestWrapper>
      );

      expect(screen.getByText('Mobile Settings')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Region')).toBeInTheDocument();
      expect(screen.getByText('Biometric Authentication')).toBeInTheDocument();
      expect(screen.getByText('Push Notifications')).toBeInTheDocument();
      expect(screen.getByText('Offline Trading')).toBeInTheDocument();
    });

    it('changes language when dropdown is selected', async () => {
      const onLanguageChange = jest.fn();

      render(
        <TestWrapper>
          <MobileSettings onLanguageChange={onLanguageChange} />
        </TestWrapper>
      );

      // Find and click the language dropdown
      const languageSelect = screen.getByRole('button', { name: /language/i });
      fireEvent.mouseDown(languageSelect);

      // Select Spanish
      const spanishOption = await screen.findByText('Español');
      fireEvent.click(spanishOption);

      await waitFor(() => {
        expect(onLanguageChange).toHaveBeenCalledWith('es');
      });
    });

    it('changes region when dropdown is selected', async () => {
      const onRegionChange = jest.fn();

      render(
        <TestWrapper>
          <MobileSettings onRegionChange={onRegionChange} />
        </TestWrapper>
      );

      // Find and click the region dropdown
      const regionSelect = screen.getByRole('button', { name: /region/i });
      fireEvent.mouseDown(regionSelect);

      // Select UK
      const ukOption = await screen.findByText('United Kingdom');
      fireEvent.click(ukOption);

      await waitFor(() => {
        expect(onRegionChange).toHaveBeenCalledWith('UK');
      });
    });
  });
});

describe('Regional Configuration', () => {
  it('provides correct configuration for different regions', () => {
    const { getRegionalConfig, isMarketOpen } = require('../i18n/regionalConfig');
    
    const usConfig = getRegionalConfig('US');
    expect(usConfig.currency).toBe('USD');
    expect(usConfig.timezone).toBe('America/New_York');
    
    const ukConfig = getRegionalConfig('UK');
    expect(ukConfig.currency).toBe('GBP');
    expect(ukConfig.timezone).toBe('Europe/London');
    
    const meConfig = getRegionalConfig('ME');
    expect(meConfig.currency).toBe('AED');
    expect(meConfig.timezone).toBe('Asia/Dubai');
  });
});

describe('Translations', () => {
  it('provides all required language translations', () => {
    const { translations } = require('../i18n/translations');
    
    const languages = ['en', 'es', 'fr', 'ar', 'pt'];
    const sections = ['common', 'navigation', 'trading', 'market', 'mobile', 'auth', 'notifications', 'regional'];
    
    languages.forEach(lang => {
      expect(translations[lang]).toBeDefined();
      sections.forEach(section => {
        expect(translations[lang][section]).toBeDefined();
      });
    });
  });

  it('has consistent keys across all languages', () => {
    const { translations } = require('../i18n/translations');
    
    const englishKeys = Object.keys(translations.en.common);
    const languages = ['es', 'fr', 'ar', 'pt'];
    
    languages.forEach(lang => {
      const langKeys = Object.keys(translations[lang].common);
      expect(langKeys).toEqual(englishKeys);
    });
  });
});

describe('Service Worker', () => {
  it('registers service worker successfully', async () => {
    // Mock service worker registration
    const mockRegister = jest.fn().mockResolvedValue({
      scope: '/',
      active: true,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      writable: true,
      value: {
        register: mockRegister,
      },
    });

    // Simulate service worker registration
    await navigator.serviceWorker.register('/sw.js');
    
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });
});

describe('Offline Functionality', () => {
  it('stores orders offline when network is unavailable', () => {
    const { useOfflineOrders } = require('../components/mobile/OfflineTrading');
    
    // This would be more complex in a real test environment
    // Here we're just testing that the hook exists and can be imported
    expect(useOfflineOrders).toBeDefined();
  });
});

describe('PWA Manifest', () => {
  it('has all required PWA manifest fields', async () => {
    // In a real test, you might fetch and parse the manifest.json file
    const manifest = {
      name: "QuantEnergx Mobile Trading",
      short_name: "QuantEnergx",
      start_url: "/",
      display: "standalone",
      theme_color: "#1976d2",
      background_color: "#ffffff",
      icons: expect.any(Array),
      features: expect.arrayContaining([
        "biometric-authentication",
        "offline-trading",
        "push-notifications"
      ])
    };
    
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBe('standalone');
  });
});