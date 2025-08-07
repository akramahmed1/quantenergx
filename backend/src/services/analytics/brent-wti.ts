/**
 * Brent-WTI Spread Analytics Service
 * TensorFlow-based prediction and anomaly detection for oil price spreads
 * Designed to detect price manipulation and provide trading insights
 */

import * as tf from '@tensorflow/tfjs-node';

interface BrentWTIDataPoint {
  timestamp: string;
  brent_price: number;
  wti_price: number;
  spread: number;
  volume_brent?: number;
  volume_wti?: number;
  external_factors?: {
    geopolitical_risk: number;
    inventory_levels: number;
    refining_margins: number;
    currency_strength: number;
  };
}

interface SpreadPrediction {
  timestamp: string;
  predicted_spread: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  confidence_score: number;
  market_regime: 'normal' | 'contango' | 'backwardation' | 'volatile';
}

interface AnomalyDetection {
  timestamp: string;
  anomaly_score: number;
  is_anomaly: boolean;
  anomaly_type: 'spread_manipulation' | 'volume_spike' | 'correlation_break' | 'regime_change';
  severity: 'low' | 'medium' | 'high' | 'critical';
  benchmark_comparison: {
    vitol_deviation: number;
    trafigura_deviation: number;
    market_consensus_deviation: number;
  };
}

interface BenchmarkData {
  vitol_spread: number;
  trafigura_spread: number;
  market_consensus: number;
  participant_count: number;
}

export class BrentWTIAnalyticsService {
  private predictionModel: tf.LayersModel | null = null;
  private anomalyModel: tf.LayersModel | null = null;
  private scaler: {
    mean: number[];
    std: number[];
  } | null = null;
  private isInitialized = false;
  private historicalData: BrentWTIDataPoint[] = [];

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize the analytics service and load models
   * TODO: Replace with actual model loading from persistent storage
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadModels();
      await this.loadScalingParameters();
      this.isInitialized = true;
      console.log('BrentWTI Analytics Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BrentWTI Analytics Service:', error);
      // Initialize with mock models for development
      await this.initializeMockModels();
      this.isInitialized = true;
    }
  }

  /**
   * Load TensorFlow models from storage
   * TODO: Replace with actual model loading from file system or remote storage
   */
  private async loadModels(): Promise<void> {
    try {
      // TODO: Load actual trained models
      // this.predictionModel = await tf.loadLayersModel('file://./models/brent_wti_prediction.json');
      // this.anomalyModel = await tf.loadLayersModel('file://./models/brent_wti_anomaly.json');
      
      // For now, create placeholder models
      await this.initializeMockModels();
    } catch (error) {
      console.warn('Could not load saved models, initializing with mock models');
      await this.initializeMockModels();
    }
  }

  /**
   * Initialize mock models for development and testing
   * TODO: Replace with actual trained models
   */
  private async initializeMockModels(): Promise<void> {
    // Create a simple LSTM-like model for spread prediction
    this.predictionModel = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [24], // 24 features (prices, spreads, technical indicators, etc.)
          units: 64,
          activation: 'tanh',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 32,
          activation: 'tanh',
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 16,
          activation: 'tanh',
        }),
        tf.layers.dense({
          units: 1, // Single output for spread prediction
          activation: 'linear',
        }),
      ],
    });

    this.predictionModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['meanAbsoluteError'],
    });

    // Create a simple autoencoder for anomaly detection
    this.anomalyModel = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [20], // 20 features for anomaly detection
          units: 12,
          activation: 'tanh',
        }),
        tf.layers.dense({
          units: 6,
          activation: 'tanh',
        }),
        tf.layers.dense({
          units: 12,
          activation: 'tanh',
        }),
        tf.layers.dense({
          units: 20, // Reconstruct input
          activation: 'linear',
        }),
      ],
    });

    this.anomalyModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    });
  }

  /**
   * Load scaling parameters for feature normalization
   * TODO: Load from persistent storage based on training data
   */
  private async loadScalingParameters(): Promise<void> {
    // Mock scaling parameters - in production, these would be calculated from training data
    this.scaler = {
      mean: [
        // Price features
        75.0, 70.0, 5.0,  // brent, wti, spread
        // Technical indicators  
        0.5, 0.3, 0.2, 0.4, 0.6, 0.1, 0.8, 0.9, 0.7, 
        // Volume features
        1000000, 800000,
        // External factors
        0.3, 0.5, 0.4, 0.6, 0.2, 0.7, 0.1, 0.9, 0.8
      ],
      std: [
        // Price features  
        15.0, 12.0, 3.0,
        // Technical indicators
        0.2, 0.15, 0.1, 0.25, 0.3, 0.05, 0.4, 0.35, 0.3,
        // Volume features
        500000, 400000,
        // External factors
        0.15, 0.2, 0.18, 0.25, 0.1, 0.3, 0.05, 0.4, 0.35
      ],
    };
  }

  /**
   * Predict Brent-WTI spread using TensorFlow model
   * Includes confidence intervals and market regime identification
   */
  async predictSpread(
    recentData: BrentWTIDataPoint[],
    forecastHorizon: number = 24
  ): Promise<SpreadPrediction[]> {
    if (!this.isInitialized || !this.predictionModel) {
      throw new Error('Analytics service not initialized');
    }

    try {
      const features = this.extractPredictionFeatures(recentData);
      const normalizedFeatures = this.normalizeFeatures(features);
      
      // Convert to tensor
      const inputTensor = tf.tensor2d([normalizedFeatures], [1, normalizedFeatures.length]);
      
      // Generate predictions for the forecast horizon
      const predictions: SpreadPrediction[] = [];
      
      for (let i = 0; i < forecastHorizon; i++) {
        // Make prediction
        const predictionTensor = this.predictionModel.predict(inputTensor) as tf.Tensor;
        const predictionValue = (await predictionTensor.data())[0];
        
        // Calculate confidence interval using Monte Carlo dropout
        const confidenceInterval = await this.calculateConfidenceInterval(
          inputTensor,
          this.predictionModel
        );
        
        // Determine market regime
        const marketRegime = this.determineMarketRegime(predictionValue, recentData);
        
        // Calculate timestamp for prediction
        const lastTimestamp = new Date(recentData[recentData.length - 1].timestamp);
        const predictionTimestamp = new Date(
          lastTimestamp.getTime() + (i + 1) * 60 * 60 * 1000 // Add hours
        );
        
        predictions.push({
          timestamp: predictionTimestamp.toISOString(),
          predicted_spread: predictionValue,
          confidence_interval: confidenceInterval,
          confidence_score: this.calculateConfidenceScore(confidenceInterval, predictionValue),
          market_regime: marketRegime,
        });
        
        // Clean up tensors
        predictionTensor.dispose();
      }
      
      inputTensor.dispose();
      return predictions;
      
    } catch (error: any) {
      console.error('Error in spread prediction:', error);
      throw new Error(`Spread prediction failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Detect anomalies in Brent-WTI spread data
   * Focuses on price manipulation detection and benchmark comparison
   */
  async detectAnomalies(
    data: BrentWTIDataPoint[],
    benchmarkData: BenchmarkData
  ): Promise<AnomalyDetection[]> {
    if (!this.isInitialized || !this.anomalyModel) {
      throw new Error('Analytics service not initialized');
    }

    try {
      const anomalies: AnomalyDetection[] = [];
      
      for (const dataPoint of data) {
        // Extract features for anomaly detection
        const features = this.extractAnomalyFeatures([dataPoint], data);
        const normalizedFeatures = this.normalizeFeatures(features.slice(0, 20)); // Take first 20 features
        
        // Convert to tensor
        const inputTensor = tf.tensor2d([normalizedFeatures], [1, normalizedFeatures.length]);
        
        // Get reconstruction from autoencoder
        const reconstructionTensor = this.anomalyModel.predict(inputTensor) as tf.Tensor;
        const reconstruction = await reconstructionTensor.data();
        
        // Calculate reconstruction error (anomaly score)
        const anomalyScore = this.calculateReconstructionError(normalizedFeatures, Array.from(reconstruction));
        
        // Determine if it's an anomaly
        const isAnomaly = anomalyScore > 0.15; // Threshold for anomaly detection
        
        if (isAnomaly) {
          const anomalyType = this.classifyAnomalyType(dataPoint, anomalyScore, benchmarkData);
          const severity = this.determineSeverity(anomalyScore, anomalyType);
          
          anomalies.push({
            timestamp: dataPoint.timestamp,
            anomaly_score: anomalyScore,
            is_anomaly: isAnomaly,
            anomaly_type: anomalyType,
            severity: severity,
            benchmark_comparison: {
              vitol_deviation: Math.abs(dataPoint.spread - benchmarkData.vitol_spread),
              trafigura_deviation: Math.abs(dataPoint.spread - benchmarkData.trafigura_spread),
              market_consensus_deviation: Math.abs(dataPoint.spread - benchmarkData.market_consensus),
            },
          });
        }
        
        // Clean up tensors
        inputTensor.dispose();
        reconstructionTensor.dispose();
      }
      
      return anomalies;
      
    } catch (error: any) {
      console.error('Error in anomaly detection:', error);
      throw new Error(`Anomaly detection failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Generate comprehensive analytics dashboard data
   * Combines predictions, anomalies, and benchmark analysis
   */
  async generateAnalyticsDashboard(
    recentData: BrentWTIDataPoint[],
    benchmarkData: BenchmarkData
  ): Promise<{
    predictions: SpreadPrediction[];
    anomalies: AnomalyDetection[];
    summary: {
      current_spread: number;
      spread_trend: 'increasing' | 'decreasing' | 'stable';
      market_health: 'healthy' | 'concerning' | 'critical';
      benchmark_alignment: number;
    };
    recommendations: string[];
  }> {
    try {
      // Generate predictions
      const predictions = await this.predictSpread(recentData, 24);
      
      // Detect anomalies
      const anomalies = await this.detectAnomalies(recentData, benchmarkData);
      
      // Calculate summary metrics
      const currentSpread = recentData[recentData.length - 1].spread;
      const spreadTrend = this.calculateSpreadTrend(recentData);
      const marketHealth = this.assessMarketHealth(anomalies, predictions);
      const benchmarkAlignment = this.calculateBenchmarkAlignment(currentSpread, benchmarkData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(anomalies, predictions, spreadTrend);
      
      return {
        predictions,
        anomalies,
        summary: {
          current_spread: currentSpread,
          spread_trend: spreadTrend,
          market_health: marketHealth,
          benchmark_alignment: benchmarkAlignment,
        },
        recommendations,
      };
      
    } catch (error: any) {
      console.error('Error generating analytics dashboard:', error);
      throw new Error(`Dashboard generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Private helper methods

  private extractPredictionFeatures(data: BrentWTIDataPoint[]): number[] {
    const latest = data[data.length - 1];
    const features: number[] = [];
    
    // Current prices and spread
    features.push(latest.brent_price, latest.wti_price, latest.spread);
    
    // Technical indicators (calculated from recent data)
    const prices = data.map(d => d.spread);
    features.push(
      this.calculateSMA(prices, 5),    // 5-period moving average
      this.calculateSMA(prices, 20),   // 20-period moving average
      this.calculateRSI(prices),       // RSI
      this.calculateVolatility(prices), // Volatility
      this.calculateMomentum(prices, 5), // 5-period momentum
      this.calculateBollingerPosition(prices), // Bollinger band position
      this.calculateMACD(prices).macd, // MACD
      this.calculateMACD(prices).signal, // MACD signal
      this.calculateTrend(prices),     // Trend indicator
    );
    
    // Volume features
    features.push(
      latest.volume_brent || 1000000,
      latest.volume_wti || 800000
    );
    
    // External factors
    const extFactors = latest.external_factors || {
      geopolitical_risk: 0.3,
      inventory_levels: 0.5,
      refining_margins: 0.4,
      currency_strength: 0.6,
    };
    features.push(
      extFactors.geopolitical_risk,
      extFactors.inventory_levels,
      extFactors.refining_margins,
      extFactors.currency_strength,
    );
    
    // Time-based features
    const timestamp = new Date(latest.timestamp);
    features.push(
      timestamp.getHours() / 24,       // Hour of day
      timestamp.getDay() / 7,          // Day of week
      timestamp.getMonth() / 12,       // Month of year
      this.isUSTrading(timestamp) ? 1 : 0, // US trading hours
      this.isEuropeanTrading(timestamp) ? 1 : 0, // European trading hours
    );
    
    return features;
  }

  private extractAnomalyFeatures(current: BrentWTIDataPoint[], historical: BrentWTIDataPoint[]): number[] {
    const latest = current[0];
    const features: number[] = [];
    
    // Price and spread features
    features.push(latest.brent_price, latest.wti_price, latest.spread);
    
    // Deviation from historical norms
    const historicalSpreads = historical.map(d => d.spread);
    const meanSpread = historicalSpreads.reduce((a, b) => a + b, 0) / historicalSpreads.length;
    const stdSpread = Math.sqrt(
      historicalSpreads.reduce((sum, x) => sum + Math.pow(x - meanSpread, 2), 0) / historicalSpreads.length
    );
    
    features.push(
      (latest.spread - meanSpread) / stdSpread, // Z-score of spread
      latest.spread - meanSpread,               // Absolute deviation
    );
    
    // Volume anomalies
    const avgVolumeBrent = historical.reduce((sum, d) => sum + (d.volume_brent || 1000000), 0) / historical.length;
    const avgVolumeWTI = historical.reduce((sum, d) => sum + (d.volume_wti || 800000), 0) / historical.length;
    
    features.push(
      (latest.volume_brent || 1000000) / avgVolumeBrent,
      (latest.volume_wti || 800000) / avgVolumeWTI,
    );
    
    // Price momentum and volatility indicators
    const recentPrices = historical.slice(-10).map(d => d.spread);
    features.push(
      this.calculateVolatility(recentPrices),
      this.calculateMomentum(recentPrices, 3),
      this.calculateSkewness(recentPrices),
      this.calculateKurtosis(recentPrices),
    );
    
    // Market microstructure indicators
    features.push(
      this.calculateSpreadVelocity(historical.slice(-5)),
      this.calculatePriceAcceleration(historical.slice(-5)),
      this.calculateCorrelationBreak(historical),
    );
    
    // External factor deviations
    const extFactors = latest.external_factors || {
      geopolitical_risk: 0.3,
      inventory_levels: 0.5,
      refining_margins: 0.4,
      currency_strength: 0.6,
    };
    
    features.push(
      extFactors.geopolitical_risk,
      extFactors.inventory_levels,
      extFactors.refining_margins,
      extFactors.currency_strength,
    );
    
    return features;
  }

  private normalizeFeatures(features: number[]): number[] {
    if (!this.scaler) {
      throw new Error('Scaler not initialized');
    }
    
    return features.map((feature, index) => {
      const mean = this.scaler!.mean[index] || 0;
      const std = this.scaler!.std[index] || 1;
      return (feature - mean) / std;
    });
  }

  private async calculateConfidenceInterval(
    input: tf.Tensor,
    model: tf.LayersModel,
    samples: number = 100
  ): Promise<{ lower: number; upper: number }> {
    const predictions: number[] = [];
    
    // Monte Carlo dropout for uncertainty estimation
    for (let i = 0; i < samples; i++) {
      const prediction = model.predict(input) as tf.Tensor;
      const value = (await prediction.data())[0];
      predictions.push(value);
      prediction.dispose();
    }
    
    predictions.sort((a, b) => a - b);
    const lowerIndex = Math.floor(samples * 0.025);
    const upperIndex = Math.floor(samples * 0.975);
    
    return {
      lower: predictions[lowerIndex],
      upper: predictions[upperIndex],
    };
  }

  private calculateConfidenceScore(
    confidenceInterval: { lower: number; upper: number },
    prediction: number
  ): number {
    const interval_width = confidenceInterval.upper - confidenceInterval.lower;
    const relative_width = interval_width / Math.abs(prediction);
    return Math.max(0, Math.min(1, 1 - relative_width));
  }

  private determineMarketRegime(
    predictedSpread: number,
    historicalData: BrentWTIDataPoint[]
  ): 'normal' | 'contango' | 'backwardation' | 'volatile' {
    const recentVolatility = this.calculateVolatility(
      historicalData.slice(-20).map(d => d.spread)
    );
    
    if (recentVolatility > 0.5) return 'volatile';
    if (predictedSpread > 8) return 'backwardation';
    if (predictedSpread < -2) return 'contango';
    return 'normal';
  }

  private calculateReconstructionError(original: number[], reconstructed: number[]): number {
    let sumSquaredError = 0;
    for (let i = 0; i < original.length; i++) {
      sumSquaredError += Math.pow(original[i] - reconstructed[i], 2);
    }
    return Math.sqrt(sumSquaredError / original.length);
  }

  private classifyAnomalyType(
    dataPoint: BrentWTIDataPoint,
    anomalyScore: number,
    benchmarkData: BenchmarkData
  ): 'spread_manipulation' | 'volume_spike' | 'correlation_break' | 'regime_change' {
    const spreadDeviation = Math.max(
      Math.abs(dataPoint.spread - benchmarkData.vitol_spread),
      Math.abs(dataPoint.spread - benchmarkData.trafigura_spread)
    );
    
    const volumeMultiplier = Math.max(
      (dataPoint.volume_brent || 1000000) / 1000000,
      (dataPoint.volume_wti || 800000) / 800000
    );
    
    if (spreadDeviation > 5 && anomalyScore > 0.3) return 'spread_manipulation';
    if (volumeMultiplier > 3) return 'volume_spike';
    if (anomalyScore > 0.4) return 'regime_change';
    return 'correlation_break';
  }

  private determineSeverity(
    anomalyScore: number,
    anomalyType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (anomalyType === 'spread_manipulation' && anomalyScore > 0.5) return 'critical';
    if (anomalyScore > 0.4) return 'high';
    if (anomalyScore > 0.25) return 'medium';
    return 'low';
  }

  // Technical indicator calculations
  private calculateSMA(prices: number[], period: number): number {
    const relevant = prices.slice(-period);
    return relevant.reduce((a, b) => a + b, 0) / relevant.length;
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateVolatility(prices: number[]): number {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  private calculateMomentum(prices: number[], period: number): number {
    if (prices.length < period + 1) return 0;
    return (prices[prices.length - 1] - prices[prices.length - 1 - period]) / prices[prices.length - 1 - period];
  }

  private calculateBollingerPosition(prices: number[], period: number = 20): number {
    const sma = this.calculateSMA(prices, period);
    const std = Math.sqrt(
      prices.slice(-period).reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period
    );
    const current = prices[prices.length - 1];
    return (current - sma) / (2 * std); // Position within Bollinger Bands
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // For simplicity, using SMA instead of EMA for signal line
    const signal = macd * 0.9; // Mock signal line
    
    return { macd, signal };
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    let upward = 0;
    let total = 0;
    
    for (let i = 1; i < prices.length; i++) {
      total++;
      if (prices[i] > prices[i - 1]) upward++;
    }
    
    return upward / total; // Percentage of upward moves
  }

  private calculateSpreadTrend(data: BrentWTIDataPoint[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 5) return 'stable';
    
    const recent = data.slice(-5);
    const trend = this.calculateTrend(recent.map(d => d.spread));
    
    if (trend > 0.6) return 'increasing';
    if (trend < 0.4) return 'decreasing';
    return 'stable';
  }

  private calculateSkewness(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length);
    
    const skew = values.reduce((sum, x) => sum + Math.pow((x - mean) / std, 3), 0) / values.length;
    return skew;
  }

  private calculateKurtosis(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / values.length);
    
    const kurt = values.reduce((sum, x) => sum + Math.pow((x - mean) / std, 4), 0) / values.length - 3;
    return kurt;
  }

  private calculateSpreadVelocity(data: BrentWTIDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const timeDeltas = [];
    const spreadDeltas = [];
    
    for (let i = 1; i < data.length; i++) {
      const timeDelta = new Date(data[i].timestamp).getTime() - new Date(data[i - 1].timestamp).getTime();
      const spreadDelta = data[i].spread - data[i - 1].spread;
      
      timeDeltas.push(timeDelta);
      spreadDeltas.push(spreadDelta);
    }
    
    const avgTimeDelta = timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length;
    const avgSpreadDelta = spreadDeltas.reduce((a, b) => a + b, 0) / spreadDeltas.length;
    
    return avgSpreadDelta / (avgTimeDelta / (60 * 60 * 1000)); // Per hour
  }

  private calculatePriceAcceleration(data: BrentWTIDataPoint[]): number {
    if (data.length < 3) return 0;
    
    const velocities = [];
    for (let i = 1; i < data.length - 1; i++) {
      const v1 = data[i].spread - data[i - 1].spread;
      const v2 = data[i + 1].spread - data[i].spread;
      velocities.push(v2 - v1);
    }
    
    return velocities.reduce((a, b) => a + b, 0) / velocities.length;
  }

  private calculateCorrelationBreak(data: BrentWTIDataPoint[]): number {
    if (data.length < 10) return 0;
    
    const brentPrices = data.map(d => d.brent_price);
    const wtiPrices = data.map(d => d.wti_price);
    
    const correlation = this.calculateCorrelation(brentPrices, wtiPrices);
    const expectedCorrelation = 0.85; // Historical average
    
    return Math.abs(correlation - expectedCorrelation);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      
      numerator += deltaX * deltaY;
      denomX += deltaX * deltaX;
      denomY += deltaY * deltaY;
    }
    
    return numerator / Math.sqrt(denomX * denomY);
  }

  private isUSTrading(date: Date): boolean {
    const hour = date.getUTCHours();
    const day = date.getUTCDay();
    
    // US trading hours: 14:30-21:00 UTC (9:30AM-4:00PM EST), Monday-Friday
    return day >= 1 && day <= 5 && hour >= 14 && hour < 21;
  }

  private isEuropeanTrading(date: Date): boolean {
    const hour = date.getUTCHours();
    const day = date.getUTCDay();
    
    // European trading hours: 8:00-17:00 UTC, Monday-Friday
    return day >= 1 && day <= 5 && hour >= 8 && hour < 17;
  }

  private assessMarketHealth(
    anomalies: AnomalyDetection[],
    predictions: SpreadPrediction[]
  ): 'healthy' | 'concerning' | 'critical' {
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
    const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
    
    const lowConfidencePredictions = predictions.filter(p => p.confidence_score < 0.5).length;
    
    if (criticalAnomalies > 0 || highAnomalies > 3) return 'critical';
    if (highAnomalies > 1 || lowConfidencePredictions > predictions.length * 0.5) return 'concerning';
    return 'healthy';
  }

  private calculateBenchmarkAlignment(
    currentSpread: number,
    benchmarkData: BenchmarkData
  ): number {
    const avgBenchmark = (benchmarkData.vitol_spread + benchmarkData.trafigura_spread + benchmarkData.market_consensus) / 3;
    const deviation = Math.abs(currentSpread - avgBenchmark);
    
    // Return alignment score (0-1, where 1 is perfect alignment)
    return Math.max(0, 1 - deviation / 10);
  }

  private generateRecommendations(
    anomalies: AnomalyDetection[],
    predictions: SpreadPrediction[],
    trend: string
  ): string[] {
    const recommendations: string[] = [];
    
    // Anomaly-based recommendations
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push('IMMEDIATE ACTION: Critical anomalies detected - investigate potential price manipulation');
    }
    
    const manipulationAnomalies = anomalies.filter(a => a.anomaly_type === 'spread_manipulation');
    if (manipulationAnomalies.length > 0) {
      recommendations.push('Monitor trading activities closely - unusual spread patterns detected');
    }
    
    // Prediction-based recommendations  
    const lowConfidencePredictions = predictions.filter(p => p.confidence_score < 0.3);
    if (lowConfidencePredictions.length > predictions.length * 0.3) {
      recommendations.push('Increase position sizing caution - model confidence is low');
    }
    
    // Trend-based recommendations
    if (trend === 'increasing') {
      recommendations.push('Consider WTI long / Brent short positions for spread convergence');
    } else if (trend === 'decreasing') {
      recommendations.push('Monitor for spread reversal opportunities');
    }
    
    // Regime-based recommendations
    const volatileRegimes = predictions.filter(p => p.market_regime === 'volatile').length;
    if (volatileRegimes > predictions.length * 0.5) {
      recommendations.push('Implement volatility-adjusted position sizing and hedging strategies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Market conditions appear normal - maintain standard trading strategies');
    }
    
    return recommendations;
  }

  /**
   * Generate mock data for testing and development
   * TODO: Replace with real market data integration
   */
  generateMockData(count: number = 100): BrentWTIDataPoint[] {
    const data: BrentWTIDataPoint[] = [];
    const baseDate = new Date();
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(baseDate.getTime() - (count - i) * 60 * 60 * 1000);
      
      // Generate correlated prices with some noise
      const brentBase = 75 + Math.sin(i * 0.1) * 5 + (Math.random() - 0.5) * 3;
      const wtiBase = brentBase - 3 + Math.sin(i * 0.08) * 2 + (Math.random() - 0.5) * 2;
      
      data.push({
        timestamp: timestamp.toISOString(),
        brent_price: brentBase,
        wti_price: wtiBase,
        spread: brentBase - wtiBase,
        volume_brent: 1000000 + Math.random() * 500000,
        volume_wti: 800000 + Math.random() * 400000,
        external_factors: {
          geopolitical_risk: 0.3 + Math.random() * 0.4,
          inventory_levels: 0.4 + Math.random() * 0.3,
          refining_margins: 0.2 + Math.random() * 0.6,
          currency_strength: 0.5 + Math.random() * 0.3,
        },
      });
    }
    
    return data;
  }

  /**
   * Get service health and model status
   */
  getServiceHealth(): {
    status: 'healthy' | 'degraded' | 'error';
    model_status: {
      prediction_model: boolean;
      anomaly_model: boolean;
    };
    last_update: string;
    features_available: string[];
  } {
    return {
      status: this.isInitialized ? 'healthy' : 'error',
      model_status: {
        prediction_model: this.predictionModel !== null,
        anomaly_model: this.anomalyModel !== null,
      },
      last_update: new Date().toISOString(),
      features_available: [
        'spread_prediction',
        'anomaly_detection',
        'benchmark_comparison',
        'market_regime_analysis',
        'price_manipulation_detection',
      ],
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.predictionModel) {
      this.predictionModel.dispose();
    }
    if (this.anomalyModel) {
      this.anomalyModel.dispose();
    }
  }
}

export default BrentWTIAnalyticsService;