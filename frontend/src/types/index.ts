/*
QuantEnergX MVP - TypeScript Type Definitions
Copyright (c) 2025 QuantEnergX. All rights reserved.
Patent Pending - Energy Trading Platform Technology
Confidential and Proprietary - SaaS Energy Trading Platform

Common TypeScript interfaces and types used throughout
the energy trading platform frontend application.
*/

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  language: SupportedLanguage;
  permissions: string[];
  company?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
  is_verified: boolean;
}

export type UserRole = 
  | 'super_admin'
  | 'admin'
  | 'trader'
  | 'analyst'
  | 'viewer'
  | 'device_operator'
  | 'compliance_officer';

export type SupportedLanguage = 'en' | 'ar' | 'fr' | 'es';

// Trading Types
export interface TradingPosition {
  position_id: string;
  symbol: string;
  position_type: 'long' | 'short';
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  stop_loss?: number;
  take_profit?: number;
  margin_requirement: number;
  created_at: string;
}

export interface TradeOrder {
  order_id: string;
  symbol: string;
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  price?: number;
  time_in_force: 'GTC' | 'IOC' | 'FOK';
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  created_at: string;
  executed_at?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  change: number;
  change_percent: number;
  timestamp: string;
}

// Analytics Types
export interface AnalyticsMetric {
  name: string;
  value: number;
  unit: string;
  change?: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface DashboardWidget {
  widget_id: string;
  widget_type: 'chart' | 'kpi' | 'table' | 'gauge' | 'map';
  title: string;
  data: any;
  configuration: Record<string, any>;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
}

// Device and IoT Types
export interface IoTDevice {
  device_id: string;
  device_name: string;
  device_type: DeviceType;
  manufacturer: string;
  model: string;
  firmware_version: string;
  location: DeviceLocation;
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  last_seen?: string;
  health_score: number;
  capacity_mw?: number;
}

export type DeviceType = 
  | 'smart_meter'
  | 'solar_panel'
  | 'wind_turbine'
  | 'battery_storage'
  | 'transformer'
  | 'grid_sensor'
  | 'weather_station'
  | 'load_controller';

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  address: string;
  region?: string;
  country?: string;
}

export interface TelemetryData {
  device_id: string;
  timestamp: string;
  measurements: Record<string, number | string | boolean>;
  data_quality: number;
  alert_level: 'normal' | 'warning' | 'critical';
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  action_url?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  status: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  company?: string;
  language: SupportedLanguage;
}

// UI Component Types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TableColumn {
  id: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: SelectOption[];
  value?: any;
}

// Theme and Styling Types
export interface ThemeConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  border_radius: string;
  font_family: string;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  validation_errors?: ValidationError[];
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

// Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
  switchLanguage: (language: SupportedLanguage) => void;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface MarketDataUpdate extends WebSocketMessage {
  type: 'price_update';
  data: {
    symbol: string;
    price: number;
    volume: number;
    timestamp: string;
  };
}

// Export utility type helpers
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

export type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;