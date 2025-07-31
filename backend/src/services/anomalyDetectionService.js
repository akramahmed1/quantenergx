/**
 * Anomaly Detection Service
 * Detects unusual patterns and anomalies in energy trading data using statistical and ML methods
 */
class AnomalyDetectionService {
  constructor() {
    this.anomalies = new Map();
    this.baselines = new Map();
    this.detectionModels = new Map();
    this.alertThresholds = {
      price: { mild: 2.5, moderate: 3.5, severe: 5.0 }, // Standard deviations
      volume: { mild: 2.0, moderate: 3.0, severe: 4.5 },
      volatility: { mild: 1.5, moderate: 2.5, severe: 3.5 },
      correlation: { mild: 0.3, moderate: 0.5, severe: 0.7 }
    };
    this.windowSizes = {
      short: 24, // 24 hours
      medium: 168, // 1 week
      long: 720 // 30 days
    };
    
    this.initializeDetectionModels();
  }

  /**
   * Initialize various anomaly detection models
   */
  initializeDetectionModels() {
    this.detectionModels.set('isolation_forest', {
      name: 'Isolation Forest',
      type: 'unsupervised',
      parameters: {
        n_estimators: 100,
        contamination: 0.1,
        max_features: 1.0
      },
      suitable_for: ['price_outliers', 'volume_spikes', 'pattern_breaks']
    });

    this.detectionModels.set('statistical_control', {
      name: 'Statistical Control Charts',
      type: 'statistical',
      parameters: {
        control_limits: 3.0, // 3-sigma limits
        window_size: 50,
        trend_detection: true
      },
      suitable_for: ['process_control', 'drift_detection', 'regime_changes']
    });

    this.detectionModels.set('lstm_autoencoder', {
      name: 'LSTM Autoencoder',
      type: 'deep_learning',
      parameters: {
        sequence_length: 24,
        encoding_dim: 8,
        threshold_percentile: 95
      },
      suitable_for: ['temporal_patterns', 'complex_anomalies', 'multivariate_detection']
    });

    this.detectionModels.set('z_score_detection', {
      name: 'Z-Score Anomaly Detection',
      type: 'statistical',
      parameters: {
        window_size: 30,
        threshold: 3.0,
        rolling_stats: true
      },
      suitable_for: ['simple_outliers', 'real_time_detection', 'baseline_deviations']
    });

    this.detectionModels.set('seasonal_decomposition', {
      name: 'Seasonal Hybrid ESD',
      type: 'time_series',
      parameters: {
        seasonal_period: 24,
        hybrid: true,
        max_anomalies: 0.1
      },
      suitable_for: ['seasonal_data', 'trend_anomalies', 'calendar_effects']
    });
  }

  /**
   * Detect anomalies in trading data
   */
  async detectAnomalies(data, commodities = ['oil', 'gas', 'renewable'], methods = ['all']) {
    try {
      const detectionResult = {
        analysis_id: this.generateAnalysisId(),
        timestamp: new Date().toISOString(),
        data_points: data.length,
        commodities_analyzed: commodities,
        methods_used: methods,
        anomalies_detected: [],
        summary: {},
        recommendations: [],
        confidence_scores: {}
      };

      // Apply different detection methods
      if (methods.includes('all') || methods.includes('statistical')) {
        const statAnomalies = await this.detectStatisticalAnomalies(data, commodities);
        detectionResult.anomalies_detected.push(...statAnomalies);
      }

      if (methods.includes('all') || methods.includes('pattern')) {
        const patternAnomalies = await this.detectPatternAnomalies(data, commodities);
        detectionResult.anomalies_detected.push(...patternAnomalies);
      }

      if (methods.includes('all') || methods.includes('correlation')) {
        const corrAnomalies = await this.detectCorrelationAnomalies(data, commodities);
        detectionResult.anomalies_detected.push(...corrAnomalies);
      }

      if (methods.includes('all') || methods.includes('volume')) {
        const volumeAnomalies = await this.detectVolumeAnomalies(data, commodities);
        detectionResult.anomalies_detected.push(...volumeAnomalies);
      }

      // Consolidate and rank anomalies
      detectionResult.anomalies_detected = this.consolidateAnomalies(detectionResult.anomalies_detected);
      detectionResult.summary = this.generateSummary(detectionResult.anomalies_detected);
      detectionResult.recommendations = this.generateRecommendations(detectionResult.anomalies_detected);
      detectionResult.confidence_scores = this.calculateConfidenceScores(detectionResult.anomalies_detected);

      this.anomalies.set(detectionResult.analysis_id, detectionResult);
      return detectionResult;

    } catch (error) {
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Detect statistical anomalies using various methods
   */
  async detectStatisticalAnomalies(data, commodities) {
    const anomalies = [];

    for (const commodity of commodities) {
      const commodityData = this.filterDataByCommodity(data, commodity);
      
      // Z-Score detection
      const zScoreAnomalies = this.detectZScoreAnomalies(commodityData, commodity);
      anomalies.push(...zScoreAnomalies);

      // Interquartile Range (IQR) detection
      const iqrAnomalies = this.detectIQRAnomalies(commodityData, commodity);
      anomalies.push(...iqrAnomalies);

      // Modified Z-Score (using median)
      const modifiedZAnomalies = this.detectModifiedZScoreAnomalies(commodityData, commodity);
      anomalies.push(...modifiedZAnomalies);
    }

    return anomalies;
  }

  /**
   * Detect pattern-based anomalies
   */
  async detectPatternAnomalies(data, commodities) {
    const anomalies = [];

    for (const commodity of commodities) {
      const commodityData = this.filterDataByCommodity(data, commodity);
      
      // Seasonal pattern breaks
      const seasonalAnomalies = this.detectSeasonalAnomalies(commodityData, commodity);
      anomalies.push(...seasonalAnomalies);

      // Trend reversals
      const trendAnomalies = this.detectTrendAnomalies(commodityData, commodity);
      anomalies.push(...trendAnomalies);

      // Volatility clustering breaks
      const volatilityAnomalies = this.detectVolatilityAnomalies(commodityData, commodity);
      anomalies.push(...volatilityAnomalies);
    }

    return anomalies;
  }

  /**
   * Detect correlation anomalies between commodities
   */
  async detectCorrelationAnomalies(data, commodities) {
    const anomalies = [];

    // Check pairwise correlations
    for (let i = 0; i < commodities.length; i++) {
      for (let j = i + 1; j < commodities.length; j++) {
        const commodity1 = commodities[i];
        const commodity2 = commodities[j];
        
        const data1 = this.filterDataByCommodity(data, commodity1);
        const data2 = this.filterDataByCommodity(data, commodity2);
        
        const corrAnomalies = this.detectPairwiseCorrelationAnomalies(data1, data2, commodity1, commodity2);
        anomalies.push(...corrAnomalies);
      }
    }

    return anomalies;
  }

  /**
   * Detect volume-based anomalies
   */
  async detectVolumeAnomalies(data, commodities) {
    const anomalies = [];

    for (const commodity of commodities) {
      const commodityData = this.filterDataByCommodity(data, commodity);
      
      // Volume spikes
      const volumeSpikes = this.detectVolumeSpikes(commodityData, commodity);
      anomalies.push(...volumeSpikes);

      // Volume-price divergence
      const divergences = this.detectVolumePriceDivergence(commodityData, commodity);
      anomalies.push(...divergences);

      // Unusual volume patterns
      const patterns = this.detectUnusualVolumePatterns(commodityData, commodity);
      anomalies.push(...patterns);
    }

    return anomalies;
  }

  /**
   * Z-Score anomaly detection
   */
  detectZScoreAnomalies(data, commodity) {
    const anomalies = [];
    const prices = data.map(d => d.price);
    const mean = this.calculateMean(prices);
    const std = this.calculateStandardDeviation(prices, mean);

    data.forEach((point, index) => {
      const zScore = Math.abs((point.price - mean) / std);
      
      if (zScore > this.alertThresholds.price.severe) {
        anomalies.push(this.createAnomaly({
          type: 'PRICE_OUTLIER',
          severity: 'SEVERE',
          commodity: commodity,
          timestamp: point.timestamp,
          value: point.price,
          expected_value: mean,
          deviation: zScore,
          method: 'z_score',
          description: `Extreme price deviation (${zScore.toFixed(2)} standard deviations)`,
          confidence: Math.min(0.95, 0.5 + (zScore - this.alertThresholds.price.severe) * 0.1)
        }));
      } else if (zScore > this.alertThresholds.price.moderate) {
        anomalies.push(this.createAnomaly({
          type: 'PRICE_OUTLIER',
          severity: 'MODERATE',
          commodity: commodity,
          timestamp: point.timestamp,
          value: point.price,
          expected_value: mean,
          deviation: zScore,
          method: 'z_score',
          description: `Significant price deviation (${zScore.toFixed(2)} standard deviations)`,
          confidence: Math.min(0.85, 0.5 + (zScore - this.alertThresholds.price.moderate) * 0.1)
        }));
      }
    });

    return anomalies;
  }

  /**
   * IQR-based anomaly detection
   */
  detectIQRAnomalies(data, commodity) {
    const anomalies = [];
    const prices = data.map(d => d.price).sort((a, b) => a - b);
    const q1 = this.calculatePercentile(prices, 25);
    const q3 = this.calculatePercentile(prices, 75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    data.forEach(point => {
      if (point.price < lowerBound || point.price > upperBound) {
        const severity = (point.price < q1 - 3 * iqr || point.price > q3 + 3 * iqr) ? 'SEVERE' : 'MODERATE';
        
        anomalies.push(this.createAnomaly({
          type: 'PRICE_OUTLIER',
          severity: severity,
          commodity: commodity,
          timestamp: point.timestamp,
          value: point.price,
          expected_range: [lowerBound, upperBound],
          method: 'iqr',
          description: `Price outside IQR bounds (${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
          confidence: severity === 'SEVERE' ? 0.9 : 0.75
        }));
      }
    });

    return anomalies;
  }

  /**
   * Modified Z-Score using median absolute deviation
   */
  detectModifiedZScoreAnomalies(data, commodity) {
    const anomalies = [];
    const prices = data.map(d => d.price);
    const median = this.calculateMedian(prices);
    const mad = this.calculateMAD(prices, median);

    data.forEach(point => {
      const modifiedZScore = 0.6745 * (point.price - median) / mad;
      
      if (Math.abs(modifiedZScore) > 3.5) {
        anomalies.push(this.createAnomaly({
          type: 'PRICE_OUTLIER',
          severity: 'MODERATE',
          commodity: commodity,
          timestamp: point.timestamp,
          value: point.price,
          expected_value: median,
          deviation: Math.abs(modifiedZScore),
          method: 'modified_z_score',
          description: `Robust outlier detection (Modified Z-Score: ${modifiedZScore.toFixed(2)})`,
          confidence: 0.8
        }));
      }
    });

    return anomalies;
  }

  /**
   * Detect seasonal pattern anomalies
   */
  detectSeasonalAnomalies(data, commodity) {
    const anomalies = [];
    
    // Group data by hour of day to detect daily patterns
    const hourlyPatterns = this.groupByHour(data);
    const expectedPattern = this.calculateSeasonalPattern(hourlyPatterns);
    
    data.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      const expectedPrice = expectedPattern[hour];
      const deviation = Math.abs((point.price - expectedPrice) / expectedPrice);
      
      if (deviation > 0.15) { // 15% deviation from seasonal pattern
        anomalies.push(this.createAnomaly({
          type: 'SEASONAL_PATTERN_BREAK',
          severity: deviation > 0.25 ? 'SEVERE' : 'MODERATE',
          commodity: commodity,
          timestamp: point.timestamp,
          value: point.price,
          expected_value: expectedPrice,
          deviation: deviation,
          method: 'seasonal_decomposition',
          description: `Unusual price for time of day (${deviation.toFixed(1)}% deviation)`,
          confidence: 0.7
        }));
      }
    });

    return anomalies;
  }

  /**
   * Detect trend anomalies
   */
  detectTrendAnomalies(data, commodity) {
    const anomalies = [];
    const window = 20; // 20-period trend
    
    for (let i = window; i < data.length; i++) {
      const recentData = data.slice(i - window, i);
      const trend = this.calculateTrend(recentData);
      const currentPoint = data[i];
      
      // Detect sudden trend reversals
      if (i > window + 5) {
        const previousTrend = this.calculateTrend(data.slice(i - window - 5, i - 5));
        const trendChange = Math.abs(trend - previousTrend);
        
        if (trendChange > 0.5) { // Significant trend change
          anomalies.push(this.createAnomaly({
            type: 'TREND_REVERSAL',
            severity: trendChange > 1.0 ? 'SEVERE' : 'MODERATE',
            commodity: commodity,
            timestamp: currentPoint.timestamp,
            value: currentPoint.price,
            previous_trend: previousTrend,
            current_trend: trend,
            method: 'trend_analysis',
            description: `Sudden trend reversal detected (change: ${trendChange.toFixed(2)})`,
            confidence: 0.75
          }));
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect volatility anomalies
   */
  detectVolatilityAnomalies(data, commodity) {
    const anomalies = [];
    const window = 24; // 24-period volatility window
    
    for (let i = window; i < data.length; i++) {
      const recentData = data.slice(i - window, i);
      const volatility = this.calculateVolatility(recentData);
      const baseline = this.getVolatilityBaseline(commodity);
      
      const volatilityRatio = volatility / baseline;
      
      if (volatilityRatio > 2.5) {
        anomalies.push(this.createAnomaly({
          type: 'VOLATILITY_SPIKE',
          severity: volatilityRatio > 4.0 ? 'SEVERE' : 'MODERATE',
          commodity: commodity,
          timestamp: data[i].timestamp,
          value: volatility,
          expected_value: baseline,
          deviation: volatilityRatio,
          method: 'volatility_analysis',
          description: `Unusual volatility spike (${volatilityRatio.toFixed(1)}x normal)`,
          confidence: 0.8
        }));
      }
    }

    return anomalies;
  }

  /**
   * Detect pairwise correlation anomalies
   */
  detectPairwiseCorrelationAnomalies(data1, data2, commodity1, commodity2) {
    const anomalies = [];
    const window = 30;
    
    // Calculate rolling correlations
    for (let i = window; i < Math.min(data1.length, data2.length); i++) {
      const subset1 = data1.slice(i - window, i).map(d => d.price);
      const subset2 = data2.slice(i - window, i).map(d => d.price);
      
      const correlation = this.calculateCorrelation(subset1, subset2);
      const expectedCorrelation = this.getExpectedCorrelation(commodity1, commodity2);
      const deviation = Math.abs(correlation - expectedCorrelation);
      
      if (deviation > this.alertThresholds.correlation.moderate) {
        anomalies.push(this.createAnomaly({
          type: 'CORRELATION_BREAK',
          severity: deviation > this.alertThresholds.correlation.severe ? 'SEVERE' : 'MODERATE',
          commodity: `${commodity1}_${commodity2}`,
          timestamp: data1[i].timestamp,
          value: correlation,
          expected_value: expectedCorrelation,
          deviation: deviation,
          method: 'correlation_analysis',
          description: `Unusual correlation between ${commodity1} and ${commodity2}`,
          confidence: 0.75
        }));
      }
    }

    return anomalies;
  }

  /**
   * Detect volume spikes
   */
  detectVolumeSpikes(data, commodity) {
    const anomalies = [];
    const volumes = data.map(d => d.volume || 1000);
    const mean = this.calculateMean(volumes);
    const std = this.calculateStandardDeviation(volumes, mean);

    data.forEach(point => {
      const volume = point.volume || 1000;
      const zScore = (volume - mean) / std;
      
      if (zScore > this.alertThresholds.volume.moderate) {
        anomalies.push(this.createAnomaly({
          type: 'VOLUME_SPIKE',
          severity: zScore > this.alertThresholds.volume.severe ? 'SEVERE' : 'MODERATE',
          commodity: commodity,
          timestamp: point.timestamp,
          value: volume,
          expected_value: mean,
          deviation: zScore,
          method: 'volume_analysis',
          description: `Unusual trading volume (${zScore.toFixed(1)} standard deviations above normal)`,
          confidence: 0.8
        }));
      }
    });

    return anomalies;
  }

  /**
   * Detect volume-price divergence
   */
  detectVolumePriceDivergence(data, commodity) {
    const anomalies = [];
    const window = 10;
    
    for (let i = window; i < data.length; i++) {
      const recentData = data.slice(i - window, i);
      const priceChange = (data[i].price - data[i - window].price) / data[i - window].price;
      const volumeChange = ((data[i].volume || 1000) - (data[i - window].volume || 1000)) / (data[i - window].volume || 1000);
      
      // Detect when price and volume move in opposite directions significantly
      if (Math.abs(priceChange) > 0.05 && Math.abs(volumeChange) > 0.3) {
        if ((priceChange > 0 && volumeChange < -0.3) || (priceChange < 0 && volumeChange > 0.3)) {
          anomalies.push(this.createAnomaly({
            type: 'VOLUME_PRICE_DIVERGENCE',
            severity: 'MODERATE',
            commodity: commodity,
            timestamp: data[i].timestamp,
            price_change: priceChange,
            volume_change: volumeChange,
            method: 'divergence_analysis',
            description: `Price and volume moving in opposite directions`,
            confidence: 0.7
          }));
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect unusual volume patterns
   */
  detectUnusualVolumePatterns(data, commodity) {
    const anomalies = [];
    
    // Detect sustained low volume periods
    let lowVolumeStreak = 0;
    const meanVolume = this.calculateMean(data.map(d => d.volume || 1000));
    
    data.forEach((point, index) => {
      const volume = point.volume || 1000;
      
      if (volume < meanVolume * 0.3) {
        lowVolumeStreak++;
      } else {
        if (lowVolumeStreak > 5) {
          anomalies.push(this.createAnomaly({
            type: 'SUSTAINED_LOW_VOLUME',
            severity: 'MILD',
            commodity: commodity,
            timestamp: point.timestamp,
            duration: lowVolumeStreak,
            method: 'pattern_analysis',
            description: `Sustained period of unusually low volume (${lowVolumeStreak} periods)`,
            confidence: 0.6
          }));
        }
        lowVolumeStreak = 0;
      }
    });

    return anomalies;
  }

  // Utility methods

  filterDataByCommodity(data, commodity) {
    return data.filter(d => d.commodity === commodity || !d.commodity);
  }

  createAnomaly(params) {
    return {
      id: this.generateAnomalyId(),
      ...params,
      detected_at: new Date().toISOString()
    };
  }

  consolidateAnomalies(anomalies) {
    // Remove duplicates and rank by severity and confidence
    const consolidated = anomalies
      .filter((anomaly, index, self) => 
        index === self.findIndex(a => 
          a.type === anomaly.type && 
          a.commodity === anomaly.commodity && 
          Math.abs(new Date(a.timestamp) - new Date(anomaly.timestamp)) < 3600000 // Within 1 hour
        )
      )
      .sort((a, b) => {
        const severityOrder = { SEVERE: 3, MODERATE: 2, MILD: 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.confidence - a.confidence;
      });

    return consolidated;
  }

  generateSummary(anomalies) {
    const summary = {
      total_anomalies: anomalies.length,
      by_severity: {
        SEVERE: anomalies.filter(a => a.severity === 'SEVERE').length,
        MODERATE: anomalies.filter(a => a.severity === 'MODERATE').length,
        MILD: anomalies.filter(a => a.severity === 'MILD').length
      },
      by_type: {},
      most_affected_commodity: null,
      average_confidence: 0
    };

    // Count by type
    anomalies.forEach(anomaly => {
      summary.by_type[anomaly.type] = (summary.by_type[anomaly.type] || 0) + 1;
    });

    // Find most affected commodity
    const commodityCounts = {};
    anomalies.forEach(anomaly => {
      commodityCounts[anomaly.commodity] = (commodityCounts[anomaly.commodity] || 0) + 1;
    });
    
    if (Object.keys(commodityCounts).length > 0) {
      summary.most_affected_commodity = Object.keys(commodityCounts)
        .reduce((a, b) => commodityCounts[a] > commodityCounts[b] ? a : b);
    }

    // Calculate average confidence
    if (anomalies.length > 0) {
      summary.average_confidence = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;
    }

    return summary;
  }

  generateRecommendations(anomalies) {
    const recommendations = [];

    const severeAnomalies = anomalies.filter(a => a.severity === 'SEVERE');
    if (severeAnomalies.length > 0) {
      recommendations.push({
        type: 'IMMEDIATE_ACTION',
        priority: 'HIGH',
        action: 'Investigate severe anomalies immediately - potential market disruption',
        anomalies: severeAnomalies.length
      });
    }

    const priceAnomalies = anomalies.filter(a => a.type.includes('PRICE'));
    if (priceAnomalies.length > 3) {
      recommendations.push({
        type: 'PRICE_MONITORING',
        priority: 'MEDIUM',
        action: 'Increase price monitoring frequency and review hedging strategies',
        anomalies: priceAnomalies.length
      });
    }

    const volumeAnomalies = anomalies.filter(a => a.type.includes('VOLUME'));
    if (volumeAnomalies.length > 2) {
      recommendations.push({
        type: 'LIQUIDITY_ASSESSMENT',
        priority: 'MEDIUM',
        action: 'Assess market liquidity and adjust position sizes accordingly',
        anomalies: volumeAnomalies.length
      });
    }

    const correlationAnomalies = anomalies.filter(a => a.type.includes('CORRELATION'));
    if (correlationAnomalies.length > 0) {
      recommendations.push({
        type: 'PORTFOLIO_REVIEW',
        priority: 'MEDIUM',
        action: 'Review portfolio diversification assumptions and correlation models',
        anomalies: correlationAnomalies.length
      });
    }

    return recommendations;
  }

  calculateConfidenceScores(anomalies) {
    const scores = {
      overall: 0,
      by_method: {},
      by_type: {}
    };

    if (anomalies.length === 0) return scores;

    scores.overall = anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length;

    // Group by method
    const methodGroups = {};
    anomalies.forEach(anomaly => {
      if (!methodGroups[anomaly.method]) methodGroups[anomaly.method] = [];
      methodGroups[anomaly.method].push(anomaly.confidence);
    });

    Object.keys(methodGroups).forEach(method => {
      scores.by_method[method] = methodGroups[method].reduce((sum, c) => sum + c, 0) / methodGroups[method].length;
    });

    // Group by type
    const typeGroups = {};
    anomalies.forEach(anomaly => {
      if (!typeGroups[anomaly.type]) typeGroups[anomaly.type] = [];
      typeGroups[anomaly.type].push(anomaly.confidence);
    });

    Object.keys(typeGroups).forEach(type => {
      scores.by_type[type] = typeGroups[type].reduce((sum, c) => sum + c, 0) / typeGroups[type].length;
    });

    return scores;
  }

  // Mathematical utility functions

  calculateMean(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  calculateStandardDeviation(values, mean) {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  calculateMAD(values, median) {
    const deviations = values.map(val => Math.abs(val - median));
    return this.calculateMedian(deviations);
  }

  calculatePercentile(sortedValues, percentile) {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower];
    }
    
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateTrend(data) {
    const prices = data.map(d => d.price);
    const n = prices.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const correlation = this.calculateCorrelation(x, prices);
    return correlation; // Simplified trend as correlation with time
  }

  calculateVolatility(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].price - data[i-1].price) / data[i-1].price);
    }
    
    const mean = this.calculateMean(returns);
    return this.calculateStandardDeviation(returns, mean);
  }

  groupByHour(data) {
    const hourlyGroups = {};
    data.forEach(point => {
      const hour = new Date(point.timestamp).getHours();
      if (!hourlyGroups[hour]) hourlyGroups[hour] = [];
      hourlyGroups[hour].push(point.price);
    });
    
    return hourlyGroups;
  }

  calculateSeasonalPattern(hourlyPatterns) {
    const pattern = {};
    Object.keys(hourlyPatterns).forEach(hour => {
      pattern[hour] = this.calculateMean(hourlyPatterns[hour]);
    });
    
    return pattern;
  }

  getVolatilityBaseline(commodity) {
    // Simulated baseline volatilities by commodity
    const baselines = {
      oil: 0.02,
      gas: 0.035,
      renewable: 0.015
    };
    return baselines[commodity] || 0.025;
  }

  getExpectedCorrelation(commodity1, commodity2) {
    // Simulated expected correlations
    const correlations = {
      'oil_gas': 0.6,
      'oil_renewable': -0.2,
      'gas_renewable': -0.1
    };
    
    const key1 = `${commodity1}_${commodity2}`;
    const key2 = `${commodity2}_${commodity1}`;
    
    return correlations[key1] || correlations[key2] || 0.0;
  }

  generateAnalysisId() {
    return `ANOM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateAnomalyId() {
    return `AN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get recent anomalies for monitoring
   */
  getRecentAnomalies(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentAnalyses = Array.from(this.anomalies.values())
      .filter(analysis => new Date(analysis.timestamp) > cutoffTime);

    const allAnomalies = [];
    recentAnalyses.forEach(analysis => {
      allAnomalies.push(...analysis.anomalies_detected);
    });

    return allAnomalies.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
  }

  /**
   * Update baselines for improved detection
   */
  updateBaselines(commodity, data) {
    const key = `${commodity}_baseline`;
    const stats = {
      mean: this.calculateMean(data.map(d => d.price)),
      std: this.calculateStandardDeviation(data.map(d => d.price), this.calculateMean(data.map(d => d.price))),
      volatility: this.calculateVolatility(data),
      updated_at: new Date().toISOString(),
      sample_size: data.length
    };
    
    this.baselines.set(key, stats);
    return stats;
  }
}

module.exports = AnomalyDetectionService;