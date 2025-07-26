/**
 * Automated Grid Data Ingestion Service
 * Handles transmission data, smart triggers, project milestones, and congestion feeds
 */
class GridDataIngestionService {
  constructor() {
    this.dataSources = new Map();
    this.congestionData = new Map();
    this.transmissionProjects = new Map();
    this.alertTriggers = new Map();
    this.queuePositions = new Map();
    this.processingQueue = [];
    this.isProcessing = false;

    this.initializeDataSources();
    this.initializeAlertTriggers();
  }

  /**
   * Initialize data sources and connections
   */
  initializeDataSources() {
    const dataSources = [
      {
        id: 'ERCOT',
        name: 'Electric Reliability Council of Texas',
        region: 'Texas',
        type: 'ISO',
        endpoints: {
          congestion: 'https://api.ercot.com/congestion',
          transmission: 'https://api.ercot.com/transmission',
          queue: 'https://api.ercot.com/queue',
        },
        updateFrequency: 300, // 5 minutes
        protocols: ['REST', 'FTP'],
      },
      {
        id: 'PJM',
        name: 'PJM Interconnection',
        region: 'Mid-Atlantic',
        type: 'RTO',
        endpoints: {
          congestion: 'https://api.pjm.com/congestion',
          transmission: 'https://api.pjm.com/transmission',
          queue: 'https://api.pjm.com/queue',
        },
        updateFrequency: 300,
        protocols: ['REST', 'SOAP'],
      },
      {
        id: 'CAISO',
        name: 'California Independent System Operator',
        region: 'California',
        type: 'ISO',
        endpoints: {
          congestion: 'https://api.caiso.com/congestion',
          transmission: 'https://api.caiso.com/transmission',
          queue: 'https://api.caiso.com/queue',
        },
        updateFrequency: 300,
        protocols: ['REST'],
      },
      {
        id: 'MISO',
        name: 'Midcontinent Independent System Operator',
        region: 'Midwest',
        type: 'RTO',
        endpoints: {
          congestion: 'https://api.miso.com/congestion',
          transmission: 'https://api.miso.com/transmission',
          queue: 'https://api.miso.com/queue',
        },
        updateFrequency: 600,
        protocols: ['REST', 'FTP'],
      },
      {
        id: 'GUYANA_GRID',
        name: 'Guyana Power and Light Grid',
        region: 'Guyana',
        type: 'National Grid',
        endpoints: {
          congestion: 'https://api.gpl.gy/congestion',
          transmission: 'https://api.gpl.gy/transmission',
          queue: 'https://api.gpl.gy/queue',
        },
        updateFrequency: 900,
        protocols: ['REST'],
      },
      {
        id: 'MENA_GRID',
        name: 'MENA Regional Grid Coordinator',
        region: 'MENA',
        type: 'Regional Grid',
        endpoints: {
          congestion: 'https://api.mena-grid.org/congestion',
          transmission: 'https://api.mena-grid.org/transmission',
          queue: 'https://api.mena-grid.org/queue',
        },
        updateFrequency: 1800,
        protocols: ['REST'],
      },
    ];

    dataSources.forEach(source => {
      this.dataSources.set(source.id, {
        ...source,
        status: 'disconnected',
        lastUpdate: null,
        errorCount: 0,
      });
    });
  }

  /**
   * Initialize smart alert triggers
   */
  initializeAlertTriggers() {
    const triggers = [
      {
        id: 'CONGESTION_HIGH',
        name: 'High Congestion Alert',
        condition: 'congestion_cost > 50',
        severity: 'high',
        actions: ['email', 'sms', 'dashboard_alert'],
      },
      {
        id: 'TRANSMISSION_OUTAGE',
        name: 'Transmission Line Outage',
        condition: 'line_status == "outage"',
        severity: 'critical',
        actions: ['email', 'sms', 'dashboard_alert', 'auto_hedge'],
      },
      {
        id: 'QUEUE_MILESTONE',
        name: 'Project Milestone Reached',
        condition: 'milestone_status == "completed"',
        severity: 'medium',
        actions: ['email', 'dashboard_alert'],
      },
      {
        id: 'CAPACITY_CONSTRAINT',
        name: 'Transmission Capacity Constraint',
        condition: 'capacity_utilization > 90',
        severity: 'high',
        actions: ['email', 'dashboard_alert', 'price_alert'],
      },
    ];

    triggers.forEach(trigger => {
      this.alertTriggers.set(trigger.id, {
        ...trigger,
        isActive: true,
        lastTriggered: null,
        triggerCount: 0,
      });
    });
  }

  /**
   * Start automated data ingestion
   */
  async startIngestion() {
    if (this.isProcessing) {
      return { status: 'already_running' };
    }

    this.isProcessing = true;

    // Connect to all data sources
    for (const [sourceId, source] of this.dataSources) {
      try {
        await this.connectToDataSource(sourceId);
        this.scheduleDataCollection(sourceId, source.updateFrequency);
      } catch (error) {
        console.error(`Failed to connect to ${sourceId}:`, error);
        source.status = 'error';
        source.errorCount++;
      }
    }

    return {
      status: 'started',
      connectedSources: Array.from(this.dataSources.values()).filter(s => s.status === 'connected')
        .length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Stop automated data ingestion
   */
  async stopIngestion() {
    this.isProcessing = false;

    // Disconnect from all sources
    for (const [sourceId, source] of this.dataSources) {
      if (source.status === 'connected') {
        await this.disconnectFromDataSource(sourceId);
      }
    }

    return {
      status: 'stopped',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Connect to specific data source
   */
  async connectToDataSource(sourceId) {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source ${sourceId} not found`);
    }

    // Simulate connection process
    await this.delay(1000);

    source.status = 'connected';
    source.lastUpdate = new Date().toISOString();
    source.errorCount = 0;

    return { sourceId, status: 'connected' };
  }

  /**
   * Disconnect from data source
   */
  async disconnectFromDataSource(sourceId) {
    const source = this.dataSources.get(sourceId);
    if (source) {
      source.status = 'disconnected';
    }
  }

  /**
   * Schedule periodic data collection
   */
  scheduleDataCollection(sourceId, intervalSeconds) {
    setInterval(async () => {
      if (this.isProcessing) {
        await this.collectDataFromSource(sourceId);
      }
    }, intervalSeconds * 1000);
  }

  /**
   * Collect data from specific source
   */
  async collectDataFromSource(sourceId) {
    const source = this.dataSources.get(sourceId);
    if (!source || source.status !== 'connected') {
      return;
    }

    try {
      // Collect different types of data
      const [congestionData, transmissionData, queueData] = await Promise.all([
        this.collectCongestionData(sourceId),
        this.collectTransmissionData(sourceId),
        this.collectQueueData(sourceId),
      ]);

      // Process and store data
      await this.processIngestedData(sourceId, {
        congestion: congestionData,
        transmission: transmissionData,
        queue: queueData,
      });

      source.lastUpdate = new Date().toISOString();
      source.errorCount = 0;
    } catch (error) {
      console.error(`Data collection failed for ${sourceId}:`, error);
      source.errorCount++;

      if (source.errorCount > 5) {
        source.status = 'error';
        await this.triggerAlert('DATA_SOURCE_ERROR', { sourceId, error: error.message });
      }
    }
  }

  /**
   * Collect congestion data
   */
  async collectCongestionData(sourceId) {
    // Simulate congestion data collection
    const congestionPoints = this.generateCongestionPoints(sourceId);
    const congestionData = [];

    for (const point of congestionPoints) {
      congestionData.push({
        nodeId: point.nodeId,
        nodeName: point.nodeName,
        congestionCost: this.simulateCongestionCost(),
        shadowPrice: this.simulateShadowPrice(),
        flowDirection: Math.random() > 0.5 ? 'import' : 'export',
        capacity: point.capacity,
        utilization: Math.random() * 100,
        timestamp: new Date().toISOString(),
      });
    }

    return congestionData;
  }

  /**
   * Collect transmission data
   */
  async collectTransmissionData(sourceId) {
    const transmissionLines = this.generateTransmissionLines(sourceId);
    const transmissionData = [];

    for (const line of transmissionLines) {
      transmissionData.push({
        lineId: line.lineId,
        lineName: line.lineName,
        fromNode: line.fromNode,
        toNode: line.toNode,
        capacity: line.capacity,
        currentFlow: this.simulateLineFlow(line.capacity),
        status: this.simulateLineStatus(),
        voltage: line.voltage,
        outageScheduled: this.generateOutageInfo(),
        timestamp: new Date().toISOString(),
      });
    }

    return transmissionData;
  }

  /**
   * Collect interconnection queue data
   */
  async collectQueueData(sourceId) {
    const queueProjects = this.generateQueueProjects(sourceId);
    const queueData = [];

    for (const project of queueProjects) {
      queueData.push({
        projectId: project.projectId,
        projectName: project.projectName,
        capacity: project.capacity,
        technology: project.technology,
        queuePosition: project.queuePosition,
        currentMilestone: this.simulateProjectMilestone(),
        expectedOnlineDate: project.expectedOnlineDate,
        interconnectionCost: this.simulateInterconnectionCost(),
        studyStatus: this.simulateStudyStatus(),
        timestamp: new Date().toISOString(),
      });
    }

    return queueData;
  }

  /**
   * Process ingested data and trigger alerts
   */
  async processIngestedData(sourceId, data) {
    // Store data
    this.congestionData.set(`${sourceId}_${Date.now()}`, data.congestion);

    // Check for alert triggers
    await this.checkAlertTriggers(sourceId, data);

    // Update analytics
    this.updateAnalytics(sourceId, data);
  }

  /**
   * Check alert triggers against incoming data
   */
  async checkAlertTriggers(sourceId, data) {
    for (const [triggerId, trigger] of this.alertTriggers) {
      if (!trigger.isActive) continue;

      const shouldTrigger = await this.evaluateTriggerCondition(trigger, data);

      if (shouldTrigger) {
        await this.executeTriggerActions(triggerId, trigger, { sourceId, data });
        trigger.lastTriggered = new Date().toISOString();
        trigger.triggerCount++;
      }
    }
  }

  /**
   * Evaluate trigger condition
   */
  async evaluateTriggerCondition(trigger, data) {
    const condition = trigger.condition;

    // Simple condition evaluation (in production, use proper expression parser)
    if (condition.includes('congestion_cost > 50')) {
      return data.congestion.some(point => point.congestionCost > 50);
    }

    if (condition.includes('line_status == "outage"')) {
      return data.transmission.some(line => line.status === 'outage');
    }

    if (condition.includes('milestone_status == "completed"')) {
      return data.queue.some(project => project.currentMilestone === 'completed');
    }

    if (condition.includes('capacity_utilization > 90')) {
      return data.transmission.some(line => line.currentFlow / line.capacity > 0.9);
    }

    return false;
  }

  /**
   * Execute trigger actions
   */
  async executeTriggerActions(triggerId, trigger, context) {
    for (const action of trigger.actions) {
      try {
        await this.executeAction(action, trigger, context);
      } catch (error) {
        console.error(`Failed to execute action ${action} for trigger ${triggerId}:`, error);
      }
    }
  }

  /**
   * Execute individual action
   */
  async executeAction(action, trigger, context) {
    switch (action) {
      case 'email':
        await this.sendEmailAlert(trigger, context);
        break;
      case 'sms':
        await this.sendSMSAlert(trigger, context);
        break;
      case 'dashboard_alert':
        await this.createDashboardAlert(trigger, context);
        break;
      case 'auto_hedge':
        await this.executeAutoHedge(trigger, context);
        break;
      case 'price_alert':
        await this.createPriceAlert(trigger, context);
        break;
    }
  }

  /**
   * Get real-time grid status dashboard
   */
  async getGridStatusDashboard() {
    const congestionSummary = await this.getCongestionSummary();
    const transmissionSummary = await this.getTransmissionSummary();
    const queueSummary = await this.getQueueSummary();
    const alertSummary = await this.getAlertSummary();

    return {
      congestion: congestionSummary,
      transmission: transmissionSummary,
      queue: queueSummary,
      alerts: alertSummary,
      dataSourceStatus: this.getDataSourceStatus(),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get congestion analysis
   */
  async getCongestionAnalysis(region = null, timeRange = '24h') {
    const congestionData = Array.from(this.congestionData.values()).flat();

    if (region) {
      // Filter by region if specified
    }

    const analysis = {
      averageCongestionCost: this.calculateAverageCongestionCost(congestionData),
      highCongestionNodes: this.identifyHighCongestionNodes(congestionData),
      congestionTrends: this.calculateCongestionTrends(congestionData, timeRange),
      impactedMarkets: this.identifyImpactedMarkets(congestionData),
      recommendations: this.generateCongestionRecommendations(congestionData),
    };

    return analysis;
  }

  // Helper methods and data generators

  generateCongestionPoints(sourceId) {
    const pointCounts = { ERCOT: 50, PJM: 40, CAISO: 35, MISO: 30, GUYANA_GRID: 10, MENA_GRID: 15 };
    const count = pointCounts[sourceId] || 20;
    const points = [];

    for (let i = 0; i < count; i++) {
      points.push({
        nodeId: `${sourceId}_NODE_${i + 1}`,
        nodeName: `${sourceId} Node ${i + 1}`,
        capacity: Math.floor(Math.random() * 1000) + 500,
        voltage: Math.random() > 0.5 ? 345 : 138,
      });
    }

    return points;
  }

  generateTransmissionLines(sourceId) {
    const lineCounts = { ERCOT: 30, PJM: 25, CAISO: 20, MISO: 18, GUYANA_GRID: 8, MENA_GRID: 12 };
    const count = lineCounts[sourceId] || 15;
    const lines = [];

    for (let i = 0; i < count; i++) {
      lines.push({
        lineId: `${sourceId}_LINE_${i + 1}`,
        lineName: `${sourceId} Transmission Line ${i + 1}`,
        fromNode: `${sourceId}_NODE_${i + 1}`,
        toNode: `${sourceId}_NODE_${i + 2}`,
        capacity: Math.floor(Math.random() * 500) + 200,
        voltage: Math.random() > 0.5 ? 345 : 138,
      });
    }

    return lines;
  }

  generateQueueProjects(sourceId) {
    const projectCounts = {
      ERCOT: 100,
      PJM: 80,
      CAISO: 70,
      MISO: 60,
      GUYANA_GRID: 20,
      MENA_GRID: 30,
    };
    const count = projectCounts[sourceId] || 40;
    const projects = [];
    const technologies = ['solar', 'wind', 'battery', 'natural_gas', 'hydro'];

    for (let i = 0; i < count; i++) {
      projects.push({
        projectId: `${sourceId}_PROJ_${i + 1}`,
        projectName: `${sourceId} Project ${i + 1}`,
        capacity: Math.floor(Math.random() * 200) + 50,
        technology: technologies[Math.floor(Math.random() * technologies.length)],
        queuePosition: i + 1,
        expectedOnlineDate: new Date(
          Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
    }

    return projects;
  }

  simulateCongestionCost() {
    return Math.random() * 100; // $0-100/MWh
  }

  simulateShadowPrice() {
    return Math.random() * 50; // $0-50/MWh
  }

  simulateLineFlow(capacity) {
    return Math.random() * capacity;
  }

  simulateLineStatus() {
    const statuses = ['normal', 'maintenance', 'outage', 'derated'];
    const weights = [0.8, 0.1, 0.05, 0.05];
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return statuses[i];
      }
    }

    return 'normal';
  }

  generateOutageInfo() {
    if (Math.random() < 0.1) {
      // 10% chance of scheduled outage
      return {
        scheduled: true,
        startDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration: Math.floor(Math.random() * 48) + 4, // 4-52 hours
      };
    }
    return { scheduled: false };
  }

  simulateProjectMilestone() {
    const milestones = [
      'application',
      'feasibility_study',
      'system_impact_study',
      'facilities_study',
      'agreement',
      'construction',
      'completed',
    ];
    return milestones[Math.floor(Math.random() * milestones.length)];
  }

  simulateInterconnectionCost() {
    return Math.floor(Math.random() * 5000000) + 500000; // $500K - $5.5M
  }

  simulateStudyStatus() {
    const statuses = ['pending', 'in_progress', 'completed', 'on_hold'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  updateAnalytics(sourceId, data) {
    // Update internal analytics (simplified)
    console.log(`Analytics updated for ${sourceId}`, {
      congestionPoints: data.congestion.length,
      transmissionLines: data.transmission.length,
      queueProjects: data.queue.length,
    });
  }

  async sendEmailAlert(trigger, context) {
    // Simulate email alert
    console.log(`Email alert sent for trigger: ${trigger.name}`);
  }

  async sendSMSAlert(trigger, context) {
    // Simulate SMS alert
    console.log(`SMS alert sent for trigger: ${trigger.name}`);
  }

  async createDashboardAlert(trigger, context) {
    // Simulate dashboard alert creation
    console.log(`Dashboard alert created for trigger: ${trigger.name}`);
  }

  async executeAutoHedge(trigger, context) {
    // Simulate automatic hedging action
    console.log(`Auto hedge executed for trigger: ${trigger.name}`);
  }

  async createPriceAlert(trigger, context) {
    // Simulate price alert creation
    console.log(`Price alert created for trigger: ${trigger.name}`);
  }

  async getCongestionSummary() {
    const allCongestionData = Array.from(this.congestionData.values()).flat();
    const highCongestionCount = allCongestionData.filter(point => point.congestionCost > 50).length;

    return {
      totalNodes: allCongestionData.length,
      highCongestionNodes: highCongestionCount,
      averageCost: this.calculateAverageCongestionCost(allCongestionData),
      maxCost: Math.max(...allCongestionData.map(point => point.congestionCost)),
    };
  }

  async getTransmissionSummary() {
    // Simulated transmission summary
    return {
      totalLines: 150,
      normalOperating: 140,
      maintenance: 8,
      outages: 2,
      avgUtilization: 65.5,
    };
  }

  async getQueueSummary() {
    // Simulated queue summary
    return {
      totalProjects: 300,
      activeProjects: 280,
      completedThisMonth: 5,
      totalCapacity: 15000, // MW
      avgQueueTime: 18, // months
    };
  }

  async getAlertSummary() {
    const activeAlerts = Array.from(this.alertTriggers.values()).filter(
      trigger => trigger.isActive && trigger.lastTriggered
    );

    return {
      totalAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(alert => alert.severity === 'critical').length,
      highAlerts: activeAlerts.filter(alert => alert.severity === 'high').length,
      recentAlerts: activeAlerts.filter(
        alert => new Date(alert.lastTriggered) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
    };
  }

  getDataSourceStatus() {
    const sources = Array.from(this.dataSources.values());
    return {
      total: sources.length,
      connected: sources.filter(s => s.status === 'connected').length,
      disconnected: sources.filter(s => s.status === 'disconnected').length,
      error: sources.filter(s => s.status === 'error').length,
      sources: sources.map(s => ({
        id: s.id,
        name: s.name,
        status: s.status,
        lastUpdate: s.lastUpdate,
        errorCount: s.errorCount,
      })),
    };
  }

  calculateAverageCongestionCost(congestionData) {
    if (congestionData.length === 0) return 0;
    return (
      congestionData.reduce((sum, point) => sum + point.congestionCost, 0) / congestionData.length
    );
  }

  identifyHighCongestionNodes(congestionData) {
    return congestionData
      .filter(point => point.congestionCost > 75)
      .sort((a, b) => b.congestionCost - a.congestionCost)
      .slice(0, 10);
  }

  calculateCongestionTrends(congestionData, timeRange) {
    // Simplified trend calculation
    return {
      trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      changePercent: (Math.random() - 0.5) * 20, // ±10%
      timeRange,
    };
  }

  identifyImpactedMarkets(congestionData) {
    const impactedMarkets = [];
    const highCongestionNodes = this.identifyHighCongestionNodes(congestionData);

    highCongestionNodes.forEach(node => {
      impactedMarkets.push({
        nodeId: node.nodeId,
        nodeName: node.nodeName,
        impactLevel: node.congestionCost > 90 ? 'severe' : 'moderate',
        estimatedPriceImpact: node.congestionCost * 0.8, // Estimated price impact
      });
    });

    return impactedMarkets;
  }

  generateCongestionRecommendations(congestionData) {
    const recommendations = [];
    const highCongestionCount = congestionData.filter(point => point.congestionCost > 75).length;

    if (highCongestionCount > 5) {
      recommendations.push('Consider hedging exposure in high-congestion zones');
      recommendations.push('Monitor transmission maintenance schedules');
    }

    if (highCongestionCount > 10) {
      recommendations.push('Implement dynamic pricing strategies');
      recommendations.push('Explore virtual transmission rights');
    }

    return recommendations;
  }

  async triggerAlert(alertType, data) {
    console.log(`Alert triggered: ${alertType}`, data);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GridDataIngestionService;
