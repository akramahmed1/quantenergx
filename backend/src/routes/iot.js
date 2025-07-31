/**
 * IoT Smart Meter Routes
 * API endpoints for IoT device and smart meter integration
 */

const express = require('express');
const router = express.Router();
const IoTSmartMeterService = require('../services/iotSmartMeterService');

const iotService = new IoTSmartMeterService();

/**
 * @route   POST /api/v1/iot/devices/register
 * @desc    Register a new IoT device or smart meter
 * @access  Private
 */
router.post('/devices/register', async (req, res) => {
  try {
    const result = await iotService.registerDevice(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/v1/iot/devices/:deviceId/data
 * @desc    Process incoming IoT data from devices
 * @access  Private
 */
router.post('/devices/:deviceId/data', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const result = await iotService.processDeviceData(deviceId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/grid/analytics
 * @desc    Get real-time grid data and analytics
 * @access  Private
 */
router.get('/grid/analytics', async (req, res) => {
  try {
    const queryParams = {
      time_range: req.query.time_range,
      region: req.query.region,
      metrics: req.query.metrics ? req.query.metrics.split(',') : undefined
    };
    
    const result = await iotService.getGridAnalytics(queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/renewable/production
 * @desc    Monitor renewable energy production
 * @access  Private
 */
router.get('/renewable/production', async (req, res) => {
  try {
    const facilityIds = req.query.facility_ids ? req.query.facility_ids.split(',') : [];
    const result = await iotService.monitorRenewableProduction(facilityIds);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/devices/:deviceId/anomalies
 * @desc    Detect anomalies in IoT data streams
 * @access  Private
 */
router.get('/devices/:deviceId/anomalies', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const options = {
      time_window: req.query.time_window,
      sensitivity: req.query.sensitivity
    };
    
    const result = await iotService.detectAnomalies(deviceId, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/protocols
 * @desc    Get supported IoT protocols and device types
 * @access  Public
 */
router.get('/protocols', (req, res) => {
  try {
    res.json({
      success: true,
      supported_protocols: {
        MQTT: {
          name: 'Message Queuing Telemetry Transport',
          description: 'Lightweight messaging protocol for IoT devices',
          port: 1883,
          secure_port: 8883,
          use_cases: ['Smart meters', 'Sensors', 'Remote monitoring']
        },
        OPCUA: {
          name: 'OPC Unified Architecture',
          description: 'Industrial automation protocol',
          port: 4840,
          use_cases: ['Industrial controllers', 'SCADA systems', 'PLCs']
        },
        MODBUS: {
          name: 'Modbus Protocol',
          description: 'Serial communication protocol for industrial devices',
          variants: ['Modbus RTU', 'Modbus TCP', 'Modbus ASCII'],
          use_cases: ['Energy meters', 'Industrial sensors', 'Control systems']
        },
        ZIGBEE: {
          name: 'ZigBee Wireless',
          description: 'Low-power wireless mesh networking',
          frequency: '2.4 GHz',
          use_cases: ['Home automation', 'Smart lighting', 'Environmental monitoring']
        },
        LORA: {
          name: 'LoRaWAN',
          description: 'Long-range wide area network for IoT',
          range: 'Up to 15 km',
          use_cases: ['Remote monitoring', 'Agricultural sensors', 'Smart cities']
        },
        REST: {
          name: 'RESTful API',
          description: 'HTTP-based web services',
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          use_cases: ['Web-enabled devices', 'Cloud integration', 'Mobile apps']
        }
      },
      device_types: {
        smart_meter: {
          name: 'Smart Energy Meter',
          capabilities: ['Energy consumption', 'Power demand', 'Voltage', 'Current'],
          typical_protocols: ['MQTT', 'MODBUS', 'REST'],
          reporting_frequency: '15 minutes'
        },
        solar_inverter: {
          name: 'Solar Inverter',
          capabilities: ['Energy production', 'Power output', 'Irradiance', 'Temperature'],
          typical_protocols: ['MODBUS', 'REST', 'MQTT'],
          reporting_frequency: '5 minutes'
        },
        wind_turbine: {
          name: 'Wind Turbine Controller',
          capabilities: ['Energy production', 'Wind speed', 'Blade angle', 'Temperature'],
          typical_protocols: ['OPCUA', 'MODBUS', 'REST'],
          reporting_frequency: '1 minute'
        },
        battery_storage: {
          name: 'Battery Management System',
          capabilities: ['State of charge', 'Power flow', 'Temperature', 'Voltage'],
          typical_protocols: ['MODBUS', 'REST', 'MQTT'],
          reporting_frequency: '1 minute'
        },
        ev_charger: {
          name: 'Electric Vehicle Charger',
          capabilities: ['Charging status', 'Power consumption', 'Session data'],
          typical_protocols: ['MQTT', 'REST', 'OPCUA'],
          reporting_frequency: '30 seconds during charging'
        },
        grid_sensor: {
          name: 'Grid Monitoring Sensor',
          capabilities: ['Voltage', 'Current', 'Frequency', 'Power factor'],
          typical_protocols: ['OPCUA', 'MODBUS', 'MQTT'],
          reporting_frequency: '1 second'
        },
        weather_station: {
          name: 'Weather Monitoring Station',
          capabilities: ['Temperature', 'Irradiance', 'Wind speed', 'Humidity'],
          typical_protocols: ['MQTT', 'LORA', 'REST'],
          reporting_frequency: '5 minutes'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/devices
 * @desc    Get list of registered IoT devices
 * @access  Private
 */
router.get('/devices', async (req, res) => {
  try {
    // Mock device list - in real implementation, query database
    const devices = [
      {
        id: 'SMART_METER_ABC_1705123456789',
        name: 'Building A Main Meter',
        type: 'smart_meter',
        status: 'active',
        last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        location: 'New York, NY'
      },
      {
        id: 'SOLAR_INVERTER_XYZ_1705123456790',
        name: 'Rooftop Solar Inverter 1',
        type: 'solar_inverter',
        status: 'active',
        last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        location: 'California, CA'
      },
      {
        id: 'WIND_TURBINE_DEF_1705123456791',
        name: 'Wind Farm Turbine 01',
        type: 'wind_turbine',
        status: 'active',
        last_seen: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        location: 'Texas, TX'
      }
    ];

    const filters = {
      type: req.query.type,
      status: req.query.status,
      location: req.query.location
    };

    let filteredDevices = devices;
    if (filters.type) {
      filteredDevices = filteredDevices.filter(d => d.type === filters.type);
    }
    if (filters.status) {
      filteredDevices = filteredDevices.filter(d => d.status === filters.status);
    }
    if (filters.location) {
      filteredDevices = filteredDevices.filter(d => 
        d.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    res.json({
      success: true,
      total_devices: filteredDevices.length,
      devices: filteredDevices,
      device_summary: {
        active_devices: filteredDevices.filter(d => d.status === 'active').length,
        device_types: [...new Set(filteredDevices.map(d => d.type))],
        locations: [...new Set(filteredDevices.map(d => d.location))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/devices/:deviceId/status
 * @desc    Get device status and latest data
 * @access  Private
 */
router.get('/devices/:deviceId/status', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Mock device status - in real implementation, query database
    const deviceStatus = {
      device_id: deviceId,
      status: 'active',
      last_seen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      connectivity: {
        protocol: 'MQTT',
        signal_strength: 85,
        connection_quality: 'good'
      },
      latest_data: {
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        energy_consumption: 125.5,
        power_demand: 5.2,
        voltage: 230.1,
        current: 22.6,
        frequency: 50.02
      },
      health_metrics: {
        uptime: '99.8%',
        data_quality_score: 95,
        last_maintenance: '2024-01-01T00:00:00Z',
        next_maintenance: '2024-07-01T00:00:00Z'
      },
      alerts: [
        {
          severity: 'info',
          message: 'Device operating normally',
          timestamp: new Date().toISOString()
        }
      ]
    };

    res.json({
      success: true,
      device_status: deviceStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/iot/dashboard
 * @desc    Get IoT dashboard summary
 * @access  Private
 */
router.get('/dashboard', async (req, res) => {
  try {
    const dashboard = {
      total_devices: 1247,
      active_devices: 1203,
      devices_by_type: {
        smart_meter: 850,
        solar_inverter: 245,
        wind_turbine: 89,
        battery_storage: 35,
        ev_charger: 18,
        grid_sensor: 8,
        weather_station: 2
      },
      real_time_metrics: {
        total_energy_production: 15678.5, // kWh
        total_energy_consumption: 23456.8, // kWh
        renewable_percentage: 42.3,
        grid_frequency: 50.02, // Hz
        average_voltage: 230.5 // V
      },
      alerts: {
        critical: 0,
        warning: 3,
        info: 12
      },
      data_quality: {
        overall_score: 94.8,
        devices_with_issues: 44,
        missing_data_points: 156
      },
      connectivity: {
        mqtt_connections: 892,
        modbus_connections: 245,
        rest_api_connections: 78,
        opcua_connections: 32
      }
    };

    res.json({
      success: true,
      dashboard: dashboard,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/v1/iot/devices/:deviceId/config
 * @desc    Update device configuration
 * @access  Private
 */
router.put('/devices/:deviceId/config', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { reporting_interval, alert_thresholds, data_retention } = req.body;
    
    // Mock configuration update
    const updatedConfig = {
      device_id: deviceId,
      configuration: {
        reporting_interval: reporting_interval || '15min',
        data_retention: data_retention || '2years',
        alert_thresholds: alert_thresholds || {},
        last_updated: new Date().toISOString(),
        updated_by: req.user?.id || 'system'
      }
    };

    res.json({
      success: true,
      message: 'Device configuration updated successfully',
      configuration: updatedConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;