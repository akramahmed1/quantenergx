import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: {
    decimalPlaces: number;
    thousandsSeparator: string;
    decimalSeparator: string;
  };
}

export interface DashboardSettings {
  layout: 'grid' | 'list';
  refreshInterval: number; // seconds
  autoRefresh: boolean;
  widgets: {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: Record<string, any>;
    visible: boolean;
  }[];
  compactView: boolean;
}

export interface TradingSettings {
  defaultCommodity: string;
  defaultQuantity: number;
  orderConfirmation: boolean;
  riskWarnings: boolean;
  positionTracking: boolean;
  autoCalculateRisk: boolean;
  defaultOrderType: 'market' | 'limit' | 'stop';
  priceAlerts: boolean;
  chartSettings: {
    timeframe: string;
    indicators: string[];
    theme: string;
  };
}

export interface RiskSettings {
  alertThresholds: {
    varLimit: number;
    concentrationLimit: number;
    leverageLimit: number;
    drawdownLimit: number;
  };
  autoAlerts: boolean;
  escalationRules: {
    level1: number; // hours
    level2: number; // hours
    level3: number; // hours
  };
  reportingFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  includeStressTests: boolean;
}

export interface ComplianceSettings {
  autoReporting: boolean;
  reportingRegions: string[];
  alertOnViolations: boolean;
  preTradeChecks: boolean;
  auditTrailRetention: number; // days
  regulatoryReports: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
  };
}

export interface NotificationSettings {
  enableBrowserNotifications: boolean;
  enableSoundAlerts: boolean;
  soundVolume: number;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  emailDigest: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    time: string;
  };
}

export interface SettingsState {
  app: AppSettings;
  dashboard: DashboardSettings;
  trading: TradingSettings;
  risk: RiskSettings;
  compliance: ComplianceSettings;
  notifications: NotificationSettings;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
}

const defaultAppSettings: AppSettings = {
  theme: 'light',
  language: 'en',
  timezone: 'UTC',
  currency: 'USD',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  numberFormat: {
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

const defaultDashboardSettings: DashboardSettings = {
  layout: 'grid',
  refreshInterval: 30,
  autoRefresh: true,
  widgets: [
    {
      id: 'market-overview',
      type: 'market-overview',
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 },
      config: {},
      visible: true,
    },
    {
      id: 'portfolio-summary',
      type: 'portfolio-summary',
      position: { x: 6, y: 0 },
      size: { width: 6, height: 4 },
      config: {},
      visible: true,
    },
    {
      id: 'risk-metrics',
      type: 'risk-metrics',
      position: { x: 0, y: 4 },
      size: { width: 4, height: 3 },
      config: {},
      visible: true,
    },
    {
      id: 'recent-trades',
      type: 'recent-trades',
      position: { x: 4, y: 4 },
      size: { width: 8, height: 3 },
      config: {},
      visible: true,
    },
  ],
  compactView: false,
};

const defaultTradingSettings: TradingSettings = {
  defaultCommodity: 'crude_oil',
  defaultQuantity: 1000,
  orderConfirmation: true,
  riskWarnings: true,
  positionTracking: true,
  autoCalculateRisk: true,
  defaultOrderType: 'limit',
  priceAlerts: true,
  chartSettings: {
    timeframe: '1D',
    indicators: ['SMA20', 'SMA50'],
    theme: 'light',
  },
};

const defaultRiskSettings: RiskSettings = {
  alertThresholds: {
    varLimit: 1000000,
    concentrationLimit: 0.25,
    leverageLimit: 3.0,
    drawdownLimit: 0.15,
  },
  autoAlerts: true,
  escalationRules: {
    level1: 1,
    level2: 4,
    level3: 12,
  },
  reportingFrequency: 'daily',
  includeStressTests: true,
};

const defaultComplianceSettings: ComplianceSettings = {
  autoReporting: true,
  reportingRegions: ['US'],
  alertOnViolations: true,
  preTradeChecks: true,
  auditTrailRetention: 2555, // 7 years
  regulatoryReports: {
    frequency: 'daily',
    recipients: ['compliance@company.com'],
    format: 'pdf',
  },
};

const defaultNotificationSettings: NotificationSettings = {
  enableBrowserNotifications: true,
  enableSoundAlerts: true,
  soundVolume: 50,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  emailDigest: {
    enabled: true,
    frequency: 'daily',
    time: '08:00',
  },
};

const initialState: SettingsState = {
  app: defaultAppSettings,
  dashboard: defaultDashboardSettings,
  trading: defaultTradingSettings,
  risk: defaultRiskSettings,
  compliance: defaultComplianceSettings,
  notifications: defaultNotificationSettings,
  loading: false,
  error: null,
  hasUnsavedChanges: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateAppSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.app = { ...state.app, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateDashboardSettings: (state, action: PayloadAction<Partial<DashboardSettings>>) => {
      state.dashboard = { ...state.dashboard, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateTradingSettings: (state, action: PayloadAction<Partial<TradingSettings>>) => {
      state.trading = { ...state.trading, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateRiskSettings: (state, action: PayloadAction<Partial<RiskSettings>>) => {
      state.risk = { ...state.risk, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateComplianceSettings: (state, action: PayloadAction<Partial<ComplianceSettings>>) => {
      state.compliance = { ...state.compliance, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
      state.hasUnsavedChanges = true;
    },
    updateWidgetPosition: (state, action: PayloadAction<{
      widgetId: string;
      position: { x: number; y: number };
      size?: { width: number; height: number };
    }>) => {
      const { widgetId, position, size } = action.payload;
      const widget = state.dashboard.widgets.find(w => w.id === widgetId);
      if (widget) {
        widget.position = position;
        if (size) {
          widget.size = size;
        }
        state.hasUnsavedChanges = true;
      }
    },
    toggleWidgetVisibility: (state, action: PayloadAction<string>) => {
      const widget = state.dashboard.widgets.find(w => w.id === action.payload);
      if (widget) {
        widget.visible = !widget.visible;
        state.hasUnsavedChanges = true;
      }
    },
    addWidget: (state, action: PayloadAction<{
      type: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      config?: Record<string, any>;
    }>) => {
      const { type, position, size, config = {} } = action.payload;
      const newWidget = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        size,
        config,
        visible: true,
      };
      state.dashboard.widgets.push(newWidget);
      state.hasUnsavedChanges = true;
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      state.dashboard.widgets = state.dashboard.widgets.filter(
        w => w.id !== action.payload
      );
      state.hasUnsavedChanges = true;
    },
    updateWidgetConfig: (state, action: PayloadAction<{
      widgetId: string;
      config: Record<string, any>;
    }>) => {
      const { widgetId, config } = action.payload;
      const widget = state.dashboard.widgets.find(w => w.id === widgetId);
      if (widget) {
        widget.config = { ...widget.config, ...config };
        state.hasUnsavedChanges = true;
      }
    },
    resetToDefaults: (state, action: PayloadAction<keyof SettingsState>) => {
      const section = action.payload;
      switch (section) {
      case 'app':
        state.app = defaultAppSettings;
        break;
      case 'dashboard':
        state.dashboard = defaultDashboardSettings;
        break;
      case 'trading':
        state.trading = defaultTradingSettings;
        break;
      case 'risk':
        state.risk = defaultRiskSettings;
        break;
      case 'compliance':
        state.compliance = defaultComplianceSettings;
        break;
      case 'notifications':
        state.notifications = defaultNotificationSettings;
        break;
      }
      state.hasUnsavedChanges = true;
    },
    loadSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      const settings = action.payload;
      if (settings.app) state.app = settings.app;
      if (settings.dashboard) state.dashboard = settings.dashboard;
      if (settings.trading) state.trading = settings.trading;
      if (settings.risk) state.risk = settings.risk;
      if (settings.compliance) state.compliance = settings.compliance;
      if (settings.notifications) state.notifications = settings.notifications;
      state.hasUnsavedChanges = false;
    },
    markSettingsSaved: (state) => {
      state.hasUnsavedChanges = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  updateAppSettings,
  updateDashboardSettings,
  updateTradingSettings,
  updateRiskSettings,
  updateComplianceSettings,
  updateNotificationSettings,
  updateWidgetPosition,
  toggleWidgetVisibility,
  addWidget,
  removeWidget,
  updateWidgetConfig,
  resetToDefaults,
  loadSettings,
  markSettingsSaved,
  setLoading,
  setError,
  clearError,
} = settingsSlice.actions;

export default settingsSlice.reducer;