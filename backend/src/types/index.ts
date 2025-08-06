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

// Derivatives and Structured Products Types
export type DerivativeType = 'future' | 'option' | 'swap' | 'structured_note';
export type OptionType = 'call' | 'put';
export type SwapType = 'commodity_swap' | 'basis_swap' | 'calendar_swap';
export type StructuredNoteType = 'autocall' | 'barrier_note' | 'range_accrual';

export interface DerivativeContract {
  id: string;
  type: DerivativeType;
  underlyingCommodity: string;
  notionalAmount: number;
  currency: string;
  maturityDate: Date;
  region: string;
  status: 'active' | 'expired' | 'terminated' | 'settled';
  createdAt: Date;
  updatedAt: Date;
}

export interface FutureContract extends DerivativeContract {
  type: 'future';
  deliveryDate: Date;
  settlementType: 'physical' | 'cash';
  tickSize: number;
  contractSize: number;
  marginRequirement: number;
}

export interface OptionContract extends DerivativeContract {
  type: 'option';
  optionType: OptionType;
  strikePrice: number;
  expirationDate: Date;
  exerciseStyle: 'american' | 'european' | 'bermudan';
  premium: number;
  volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
}

export interface SwapContract extends DerivativeContract {
  type: 'swap';
  swapType: SwapType;
  fixedRate?: number;
  floatingRateIndex?: string;
  paymentFrequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  resetFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayCountConvention: '30/360' | 'Actual/360' | 'Actual/365';
}

export interface StructuredNote extends DerivativeContract {
  type: 'structured_note';
  noteType: StructuredNoteType;
  principalProtection: number; // percentage (0-100)
  couponRate?: number;
  barrierLevel?: number;
  knockoutLevel?: number;
  participationRate?: number;
  payoffStructure: any; // JSON structure defining payoff logic
}

// Margin and Risk Management Types
export interface MarginRequirement {
  id: string;
  contractId: string;
  initialMargin: number;
  maintenanceMargin: number;
  variationMargin: number;
  currency: string;
  calculationMethod: 'span' | 'portfolio' | 'standard';
  lastCalculated: Date;
  region: string;
}

export interface MarginCall {
  id: string;
  userId: string;
  contractIds: string[];
  requiredAmount: number;
  currency: string;
  dueDate: Date;
  status: 'pending' | 'met' | 'overdue' | 'defaulted';
  region: string;
  createdAt: Date;
}

// Settlement Types
export interface SettlementInstruction {
  id: string;
  contractId: string;
  userId: string;
  settlementType: 'physical' | 'cash' | 'net_cash';
  amount: number;
  currency: string;
  settlementDate: Date;
  status: 'pending' | 'processing' | 'settled' | 'failed' | 'cancelled';
  region: string;
  deliveryInstructions?: any;
  cashflowDetails?: any;
  createdAt: Date;
  settledAt?: Date;
}

export interface SettlementWorkflow {
  id: string;
  settlementId: string;
  steps: SettlementStep[];
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  region: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface SettlementStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  description: string;
  processor?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// Region Configuration Types
export interface RegionConfig {
  region: string;
  marginRules: MarginRules;
  settlementRules: SettlementRules;
  tradingHours: TradingHours;
  complianceRules: ComplianceRules;
  currency: string;
  timezone: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface MarginRules {
  defaultInitialMarginRate: number;
  defaultMaintenanceMarginRate: number;
  marginCallGracePeriod: number; // hours
  marginCallThreshold: number;
  crossMarginingEnabled: boolean;
  portfolioMarginingEnabled: boolean;
  riskModelParameters: any;
}

export interface SettlementRules {
  standardSettlementPeriod: number; // days
  cutoffTimes: { [key: string]: string }; // e.g., {"trade_cutoff": "15:00", "settlement_cutoff": "17:00"}
  supportedSettlementMethods: string[];
  physicalDeliveryEnabled: boolean;
  cashSettlementEnabled: boolean;
  nettingEnabled: boolean;
  autoSettlementThreshold: number;
}

export interface TradingHours {
  openTime: string;
  closeTime: string;
  timezone: string;
  tradingDays: string[]; // ['monday', 'tuesday', etc.]
  holidays: Date[];
}

export interface ComplianceRules {
  positionLimits: { [commodity: string]: number };
  reportingThresholds: { [type: string]: number };
  requiredDisclosures: string[];
  riskLimits: { [type: string]: number };
}

// Market Data for Derivatives
export interface DerivativeMarketData extends MarketData {
  contractId?: string;
  impliedVolatility?: number;
  openInterest?: number;
  settlementPrice?: number;
  theoreticalValue?: number;
  greeks?: {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    rho?: number;
  };
}
