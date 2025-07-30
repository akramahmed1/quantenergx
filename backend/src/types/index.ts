export interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'trader' | 'analyst' | 'compliance';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  userId: string;
  commodity: string;
  quantity: number;
  price: number;
  side: 'buy' | 'sell';
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  timestamp: Date;
  executionTime?: Date;
  region: string;
}

export interface MarketData {
  commodity: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  region: string;
}

export interface WebSocketMessage {
  type: 'MARKET_UPDATE' | 'TRADE_UPDATE' | 'ORDER_UPDATE' | 'SYSTEM_ALERT';
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  key?: string;
  value: any;
  timestamp: Date;
}

export interface WebhookPayload {
  id: string;
  type: string;
  source: 'hardware' | 'ai' | 'third_party';
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface PluginInterface {
  name: string;
  version: string;
  type: 'data_source' | 'analytics' | 'notification' | 'compliance';
  initialize(): Promise<void>;
  execute(input: any): Promise<any>;
  cleanup(): Promise<void>;
}

export interface ComplianceResult {
  checkId: string;
  overallCompliance: boolean;
  violations: any[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  region: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}