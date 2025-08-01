/**
 * IoT Smart Meter Integration Service
 * Handles integration with IoT devices, smart meters, and grid data for analytics
 */

class IoTSmartMeterService {
  constructor() {
    this.supportedProtocols = {
      MQTT: 'Message Queuing Telemetry Transport',
      OPCUA: 'OPC Unified Architecture',
      MODBUS: 'Modbus Protocol',
      ZIGBEE: 'ZigBee Wireless',
      LORA: 'LoRaWAN',
      REST: 'RESTful API'
    };

    this.deviceTypes = {
      smart_meter: 'Smart Energy Meter',
      solar_inverter: 'Solar Inverter',
      wind_turbine: 'Wind Turbine Controller',
      battery_storage: 'Battery Management System',
      ev_charger: 'Electric Vehicle Charger',
      grid_sensor: 'Grid Monitoring Sensor',
      weather_station: 'Weather Monitoring Station'
    };

    this.dataPoints = {
      energy_consumption: { unit: 'kWh', frequency: '15min' },
      energy_production: { unit: 'kWh', frequency: '15min' },
      power_demand: { unit: 'kW', frequency: '1min' },
      voltage: { unit: 'V', frequency: '1min' },
      current: { unit: 'A', frequency: '1min' },
      frequency: { unit: 'Hz', frequency: '1min' },
      power_factor: { unit: 'ratio', frequency: '1min' },
      temperature: { unit: '°C', frequency: '5min' },
      irradiance: { unit: 'W/m²', frequency: '5min' },
      wind_speed: { unit: 'm/s', frequency: '1min' }
    };
  }

  /**
   * Register a new IoT device or smart meter
   * @param {Object} deviceData - Device registration information
   * @returns {Object} Registration result
   */
  async registerDevice(deviceData) {
    try {
      const deviceId = this.generateDeviceId(deviceData);
      
      const device = {
        id: deviceId,
        name: deviceData.name,
        type: deviceData.type,
        manufacturer: deviceData.manufacturer,
        model: deviceData.model,
        firmware_version: deviceData.firmware_version,
        location: {
          latitude: deviceData.latitude,
          longitude: deviceData.longitude,
          address: deviceData.address,
          grid_zone: deviceData.grid_zone
        },
        connectivity: {
          protocol: deviceData.protocol,
          endpoint: deviceData.endpoint,
          authentication: this.setupAuthentication(deviceData),
          last_seen: null,
          status: 'registered'
        },
        capabilities: this.getDeviceCapabilities(deviceData.type),
        configuration: {
          reporting_interval: deviceData.reporting_interval || '15min',
          data_retention: deviceData.data_retention || '2years',
          alert_thresholds: deviceData.alert_thresholds || {}
        },
        registration: {
          registered_date: new Date().toISOString(),
          registered_by: deviceData.registered_by,
          owner: deviceData.owner,
          operator: deviceData.operator
        }
      };

      // Initialize device in monitoring system
      await this.initializeDeviceMonitoring(device);

      return {
        success: true,
        device_id: deviceId,
        device: device,
        connection_instructions: this.generateConnectionInstructions(device),
        api_endpoints: this.generateAPIEndpoints(deviceId)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process incoming IoT data from devices
   * @param {String} deviceId - Device identifier
   * @param {Object} sensorData - Raw sensor data
   * @returns {Object} Data processing result
   */
  async processDeviceData(deviceId, sensorData) {
    try {
      const timestamp = new Date().toISOString();
      
      // Validate and normalize data
      const normalizedData = this.normalizeData(sensorData);
      
      // Enrich with calculated metrics
      const enrichedData = await this.enrichData(deviceId, normalizedData);
      
      // Store in time series database
      await this.storeTimeSeriesData(deviceId, enrichedData, timestamp);
      
      // Check for alerts and anomalies
      const alerts = await this.checkAlerts(deviceId, enrichedData);
      
      // Calculate energy metrics
      const energyMetrics = this.calculateEnergyMetrics(enrichedData);
      
      // Update device status
      await this.updateDeviceStatus(deviceId, 'active', timestamp);

      return {
        success: true,
        device_id: deviceId,
        timestamp: timestamp,
        data_points: Object.keys(normalizedData).length,
        energy_metrics: energyMetrics,
        alerts: alerts,
        quality_score: this.calculateDataQuality(normalizedData),
        next_expected: this.getNextExpectedReading(deviceId)
      };
    } catch (error) {
      return {
        success: false,
        device_id: deviceId,
        error: error.message
      };
    }
  }

  /**
   * Get real-time grid data and analytics
   * @param {Object} queryParams - Query parameters
   * @returns {Object} Grid data analytics
   */
  async getGridAnalytics(queryParams = {}) {
    try {
      const timeRange = queryParams.time_range || '24h';
      const region = queryParams.region || 'all';
      const metrics = queryParams.metrics || ['demand', 'supply', 'frequency', 'carbon_intensity'];

      // Mock grid data - in real implementation, aggregate from connected devices
      const gridData = {
        timestamp: new Date().toISOString(),
        region: region,
        time_range: timeRange,
        current_status: {
          total_demand: 15250.5, // MW
          total_supply: 15890.2, // MW
          reserve_margin: 4.2, // %
          grid_frequency: 50.02, // Hz
          carbon_intensity: 245, // gCO2/kWh
          renewable_percentage: 35.8 // %
        },
        demand_forecast: this.generateDemandForecast(timeRange),
        supply_mix: {
          coal: 25.5,
          natural_gas: 38.7,
          nuclear: 15.2,
          hydro: 8.1,
          wind: 7.8,
          solar: 3.9,
          other_renewables: 0.8
        },
        renewable_generation: {
          wind: {
            current_output: 1190.5, // MW
            capacity_factor: 76.2, // %
            forecast_next_24h: this.generateWindForecast()
          },
          solar: {
            current_output: 595.8, // MW
            capacity_factor: 42.1, // %
            forecast_next_24h: this.generateSolarForecast()
          },
          hydro: {
            current_output: 1235.7, // MW
            reservoir_level: 78.5, // %
            seasonal_availability: 'high'
          }
        },
        grid_stability: {
          voltage_stability: 'normal',
          frequency_deviation: 0.02,
          congestion_points: this.identifyGridCongestion(),
          emergency_reserves: 850.0 // MW
        },
        carbon_tracking: {
          current_emissions: 3738.3, // tons CO2/hour
          daily_total: 89719.2, // tons CO2
          reduction_vs_yesterday: -5.2 // %
        }
      };

      return {
        success: true,
        grid_analytics: gridData,
        data_sources: await this.getActiveDatasources(),
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Monitor renewable energy production
   * @param {Array} facilityIds - List of facility IDs to monitor
   * @returns {Object} Production monitoring data
   */
  async monitorRenewableProduction(facilityIds = []) {
    try {
      const productionData = [];

      for (const facilityId of facilityIds) {
        const facility = await this.getFacilityData(facilityId);
        const devices = await this.getFacilityDevices(facilityId);
        
        let totalProduction = 0;
        let totalCapacity = 0;
        const deviceData = [];

        for (const device of devices) {
          const latestData = await this.getLatestDeviceData(device.id);
          if (latestData && latestData.energy_production) {
            totalProduction += latestData.energy_production;
            deviceData.push({
              device_id: device.id,
              device_type: device.type,
              current_output: latestData.power_demand || 0,
              daily_production: latestData.energy_production,
              efficiency: this.calculateEfficiency(device, latestData)
            });
          }
          totalCapacity += device.rated_capacity || 0;
        }

        const capacityFactor = totalCapacity > 0 ? (totalProduction / (totalCapacity * 24)) * 100 : 0;

        productionData.push({
          facility_id: facilityId,
          facility_name: facility.name,
          facility_type: facility.type,
          location: facility.location,
          total_production: totalProduction, // kWh today
          total_capacity: totalCapacity, // kW
          capacity_factor: Math.round(capacityFactor * 100) / 100,
          device_count: devices.length,
          active_devices: deviceData.length,
          devices: deviceData,
          environmental_benefits: this.calculateEnvironmentalBenefits(totalProduction, facility.type)
        });
      }

      return {
        success: true,
        monitoring_timestamp: new Date().toISOString(),
        facilities_monitored: facilityIds.length,
        total_production: productionData.reduce((sum, f) => sum + f.total_production, 0),
        average_capacity_factor: productionData.reduce((sum, f) => sum + f.capacity_factor, 0) / productionData.length,
        production_data: productionData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect anomalies in IoT data streams
   * @param {String} deviceId - Device to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} Anomaly detection results
   */
  async detectAnomalies(deviceId, options = {}) {
    try {
      const timeWindow = options.time_window || '7d';
      const sensitivity = options.sensitivity || 'medium';
      
      // Get historical data for baseline
      const historicalData = await this.getHistoricalData(deviceId, timeWindow);
      const recentData = await this.getRecentData(deviceId, '1h');

      const anomalies = [];

      // Statistical anomaly detection
      const statisticalAnomalies = this.detectStatisticalAnomalies(historicalData, recentData, sensitivity);
      anomalies.push(...statisticalAnomalies);

      // Pattern-based anomaly detection
      const patternAnomalies = this.detectPatternAnomalies(historicalData, recentData);
      anomalies.push(...patternAnomalies);

      // Threshold-based anomaly detection
      const thresholdAnomalies = this.detectThresholdAnomalies(deviceId, recentData);
      anomalies.push(...thresholdAnomalies);

      // Machine learning-based detection (simplified)
      const mlAnomalies = this.detectMLAnomalies(historicalData, recentData);
      anomalies.push(...mlAnomalies);

      return {
        success: true,
        device_id: deviceId,
        analysis_period: timeWindow,
        anomalies_detected: anomalies.length,
        anomalies: anomalies,
        risk_level: this.calculateRiskLevel(anomalies),
        recommendations: this.generateAnomalyRecommendations(anomalies)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper methods for data processing and analysis
   */
  generateDeviceId(deviceData) {
    const timestamp = Date.now();
    const type = deviceData.type.toUpperCase();
    return `${type}_${deviceData.manufacturer}_${timestamp}`;
  }

  getDeviceCapabilities(deviceType) {
    const capabilities = {
      smart_meter: ['energy_consumption', 'power_demand', 'voltage', 'current'],
      solar_inverter: ['energy_production', 'power_demand', 'voltage', 'current', 'irradiance', 'temperature'],
      wind_turbine: ['energy_production', 'power_demand', 'wind_speed', 'temperature'],
      battery_storage: ['energy_consumption', 'energy_production', 'state_of_charge', 'temperature'],
      ev_charger: ['energy_consumption', 'power_demand', 'charging_status'],
      grid_sensor: ['voltage', 'current', 'frequency', 'power_factor'],
      weather_station: ['temperature', 'irradiance', 'wind_speed', 'humidity']
    };
    return capabilities[deviceType] || [];
  }

  setupAuthentication(deviceData) {
    return {
      method: deviceData.auth_method || 'api_key',
      api_key: this.generateAPIKey(),
      certificate_thumbprint: deviceData.certificate_thumbprint,
      token_endpoint: '/api/v1/iot/auth/token'
    };
  }

  generateAPIKey() {
    return 'qe_' + Math.random().toString(36).substr(2, 32);
  }

  async initializeDeviceMonitoring(device) {
    // Initialize monitoring for the device
    return {
      monitoring_enabled: true,
      alert_rules_configured: true,
      data_pipeline_ready: true
    };
  }

  generateConnectionInstructions(device) {
    return {
      protocol: device.connectivity.protocol,
      endpoint: `mqtt://iot.quantenergx.com:1883/devices/${device.id}`,
      authentication: {
        username: device.id,
        password: device.connectivity.authentication.api_key
      },
      topics: {
        data_publish: `devices/${device.id}/data`,
        commands_subscribe: `devices/${device.id}/commands`,
        status_publish: `devices/${device.id}/status`
      },
      sample_payload: this.generateSamplePayload(device.type)
    };
  }

  generateSamplePayload(deviceType) {
    const samples = {
      smart_meter: {
        timestamp: '2024-01-15T10:30:00Z',
        energy_consumption: 125.5,
        power_demand: 5.2,
        voltage: 230.1,
        current: 22.6
      },
      solar_inverter: {
        timestamp: '2024-01-15T10:30:00Z',
        energy_production: 45.8,
        power_demand: 7.5,
        irradiance: 850,
        temperature: 35.2
      }
    };
    return samples[deviceType] || samples.smart_meter;
  }

  generateAPIEndpoints(deviceId) {
    return {
      data_ingestion: `/api/v1/iot/devices/${deviceId}/data`,
      device_status: `/api/v1/iot/devices/${deviceId}/status`,
      historical_data: `/api/v1/iot/devices/${deviceId}/history`,
      alerts: `/api/v1/iot/devices/${deviceId}/alerts`,
      configuration: `/api/v1/iot/devices/${deviceId}/config`
    };
  }

  normalizeData(sensorData) {
    const normalized = {};
    
    Object.entries(sensorData).forEach(([key, value]) => {
      if (typeof value === 'number' && !isNaN(value)) {
        normalized[key] = value;
      }
    });

    return normalized;
  }

  async enrichData(deviceId, normalizedData) {
    // Add calculated fields and metadata
    const enriched = { ...normalizedData };
    
    if (enriched.power_demand && enriched.voltage && enriched.current) {
      enriched.power_factor = enriched.power_demand / (enriched.voltage * enriched.current);
    }

    if (enriched.energy_production && enriched.irradiance) {
      enriched.efficiency = (enriched.energy_production / enriched.irradiance) * 100;
    }

    return enriched;
  }

  async storeTimeSeriesData(deviceId, data, timestamp) {
    // Mock time series storage
    return {
      stored: true,
      device_id: deviceId,
      timestamp: timestamp,
      data_points: Object.keys(data).length
    };
  }

  async checkAlerts(deviceId, data) {
    const alerts = [];

    // Check for threshold violations
    Object.entries(data).forEach(([metric, value]) => {
      const thresholds = this.getMetricThresholds(metric);
      
      if (value > thresholds.critical_high) {
        alerts.push({
          severity: 'critical',
          type: 'threshold_exceeded',
          metric: metric,
          value: value,
          threshold: thresholds.critical_high,
          message: `${metric} critically high: ${value}`
        });
      } else if (value < thresholds.critical_low) {
        alerts.push({
          severity: 'critical',
          type: 'threshold_below',
          metric: metric,
          value: value,
          threshold: thresholds.critical_low,
          message: `${metric} critically low: ${value}`
        });
      }
    });

    return alerts;
  }

  getMetricThresholds(metric) {
    const thresholds = {
      voltage: { critical_low: 200, critical_high: 250 },
      frequency: { critical_low: 49.5, critical_high: 50.5 },
      temperature: { critical_low: -10, critical_high: 80 },
      power_demand: { critical_low: 0, critical_high: 10000 }
    };
    return thresholds[metric] || { critical_low: -999999, critical_high: 999999 };
  }

  calculateEnergyMetrics(data) {
    return {
      instantaneous_power: data.power_demand || 0,
      energy_consumed: data.energy_consumption || 0,
      energy_produced: data.energy_production || 0,
      efficiency: data.efficiency || null,
      carbon_footprint: this.calculateInstantCarbonFootprint(data)
    };
  }

  calculateInstantCarbonFootprint(data) {
    const gridCarbonIntensity = 245; // gCO2/kWh
    const energyConsumed = data.energy_consumption || 0;
    return energyConsumed * gridCarbonIntensity / 1000; // kg CO2
  }

  calculateDataQuality(data) {
    let qualityScore = 100;
    let totalPoints = Object.keys(data).length;
    
    if (totalPoints === 0) return 0;
    
    // Reduce score for missing expected data points
    if (totalPoints < 5) qualityScore -= (5 - totalPoints) * 10;
    
    return Math.max(0, qualityScore);
  }

  getNextExpectedReading(deviceId) {
    // Mock next expected reading time
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15); // 15-minute intervals
    return now.toISOString();
  }

  async updateDeviceStatus(deviceId, status, timestamp) {
    return {
      device_id: deviceId,
      status: status,
      last_seen: timestamp
    };
  }

  // Additional helper methods for analytics and forecasting
  generateDemandForecast(timeRange) {
    // Mock demand forecast
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        demand: 14000 + Math.sin(i * Math.PI / 12) * 2000 + Math.random() * 500
      });
    }
    return hours;
  }

  generateWindForecast() {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      wind_speed: 8 + Math.sin(i * Math.PI / 8) * 3 + Math.random() * 2,
      capacity_factor: 60 + Math.random() * 30
    }));
  }

  generateSolarForecast() {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      irradiance: i > 6 && i < 18 ? 400 + Math.sin((i - 6) * Math.PI / 12) * 400 : 0,
      capacity_factor: i > 6 && i < 18 ? 20 + Math.sin((i - 6) * Math.PI / 12) * 60 : 0
    }));
  }

  identifyGridCongestion() {
    return [
      { location: 'North-South Interconnect', severity: 'medium', cause: 'High renewable output' },
      { location: 'Urban Load Center', severity: 'low', cause: 'Peak demand period' }
    ];
  }

  async getActiveDatasources() {
    return {
      smart_meters: 1250,
      solar_inverters: 320,
      wind_turbines: 85,
      grid_sensors: 45,
      weather_stations: 25
    };
  }

  async getFacilityData(facilityId) {
    // Mock facility data
    return {
      id: facilityId,
      name: 'Solar Farm Alpha',
      type: 'solar',
      location: { lat: 32.7767, lng: -96.7970 },
      capacity: 50000 // kW
    };
  }

  async getFacilityDevices(facilityId) {
    // Mock facility devices
    return [
      { id: 'INV_001', type: 'solar_inverter', rated_capacity: 5000 },
      { id: 'INV_002', type: 'solar_inverter', rated_capacity: 5000 }
    ];
  }

  async getLatestDeviceData(deviceId) {
    // Mock latest device data
    return {
      energy_production: 35.5,
      power_demand: 4.2,
      efficiency: 85.2
    };
  }

  calculateEfficiency(device, data) {
    if (device.type === 'solar_inverter' && data.irradiance) {
      return (data.energy_production / data.irradiance) * 100;
    }
    return 85 + Math.random() * 10; // Mock efficiency
  }

  calculateEnvironmentalBenefits(production, facilityType) {
    const carbonSavingsFactor = {
      solar: 0.85,
      wind: 0.90,
      hydro: 0.80
    };
    
    const factor = carbonSavingsFactor[facilityType] || 0.75;
    
    return {
      carbon_saved: production * factor, // kg CO2
      trees_equivalent: Math.round(production * factor / 22), // trees
      homes_powered: Math.round(production / 30) // average daily consumption
    };
  }

  // Anomaly detection methods
  detectStatisticalAnomalies(historical, recent, sensitivity) {
    // Simplified statistical anomaly detection
    const anomalies = [];
    const thresholds = { low: 2, medium: 2.5, high: 3 };
    const threshold = thresholds[sensitivity];
    
    // Mock implementation
    if (Math.random() > 0.8) {
      anomalies.push({
        type: 'statistical',
        severity: 'medium',
        metric: 'power_demand',
        description: 'Power demand deviates significantly from historical pattern'
      });
    }
    
    return anomalies;
  }

  detectPatternAnomalies(historical, recent) {
    const anomalies = [];
    
    // Mock pattern-based detection
    if (Math.random() > 0.9) {
      anomalies.push({
        type: 'pattern',
        severity: 'low',
        metric: 'energy_production',
        description: 'Unexpected production pattern detected'
      });
    }
    
    return anomalies;
  }

  detectThresholdAnomalies(deviceId, data) {
    const anomalies = [];
    
    Object.entries(data).forEach(([metric, value]) => {
      const thresholds = this.getMetricThresholds(metric);
      if (value > thresholds.critical_high || value < thresholds.critical_low) {
        anomalies.push({
          type: 'threshold',
          severity: 'high',
          metric: metric,
          value: value,
          description: `${metric} outside acceptable range`
        });
      }
    });
    
    return anomalies;
  }

  detectMLAnomalies(historical, recent) {
    // Mock ML-based anomaly detection
    const anomalies = [];
    
    if (Math.random() > 0.85) {
      anomalies.push({
        type: 'ml_prediction',
        severity: 'medium',
        confidence: 0.85,
        description: 'Machine learning model detected unusual behavior pattern'
      });
    }
    
    return anomalies;
  }

  calculateRiskLevel(anomalies) {
    if (anomalies.some(a => a.severity === 'critical')) return 'high';
    if (anomalies.some(a => a.severity === 'high')) return 'medium';
    if (anomalies.length > 0) return 'low';
    return 'none';
  }

  generateAnomalyRecommendations(anomalies) {
    const recommendations = [];
    
    anomalies.forEach(anomaly => {
      switch (anomaly.type) {
      case 'threshold':
        recommendations.push('Review device calibration and operating parameters');
        break;
      case 'statistical':
        recommendations.push('Investigate recent changes in operating conditions');
        break;
      case 'pattern':
        recommendations.push('Check for external factors affecting normal operation');
        break;
      case 'ml_prediction':
        recommendations.push('Monitor device closely for potential issues');
        break;
      }
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  async getHistoricalData(deviceId, timeWindow) {
    // Mock historical data retrieval
    return Array.from({ length: 100 }, () => ({
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      power_demand: 5 + Math.random() * 2,
      energy_production: 30 + Math.random() * 10
    }));
  }

  async getRecentData(deviceId, timeWindow) {
    // Mock recent data retrieval
    return Array.from({ length: 10 }, () => ({
      timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      power_demand: 5.5 + Math.random() * 2,
      energy_production: 35 + Math.random() * 10
    }));
  }
}

module.exports = IoTSmartMeterService;