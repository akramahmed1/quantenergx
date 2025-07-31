#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * 
 * Monitors backend API performance and generates reports
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001/api';
    this.reportDir = options.reportDir || './performance-reports';
    this.duration = options.duration || 60000; // 1 minute
    this.interval = options.interval || 5000; // 5 seconds
    this.endpoints = options.endpoints || [
      '/health',
      '/user/profile',
      '/market/prices',
      '/trading/instruments'
    ];
    this.results = [];
  }

  async runMonitoring() {
    console.log('Starting performance monitoring...');
    console.log(`Duration: ${this.duration / 1000} seconds`);
    console.log(`Interval: ${this.interval / 1000} seconds`);
    console.log(`Endpoints: ${this.endpoints.join(', ')}`);

    const startTime = Date.now();
    const endTime = startTime + this.duration;

    while (Date.now() < endTime) {
      const timestamp = new Date().toISOString();
      console.log(`\nChecking performance at ${timestamp}`);

      for (const endpoint of this.endpoints) {
        try {
          const result = await this.measureEndpoint(endpoint);
          result.timestamp = timestamp;
          this.results.push(result);
          
          console.log(`${endpoint}: ${result.responseTime}ms (${result.status})`);
        } catch (error) {
          console.error(`${endpoint}: ERROR - ${error.message}`);
          this.results.push({
            endpoint,
            timestamp,
            error: error.message,
            responseTime: null,
            status: null
          });
        }
      }

      // Wait for next interval
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }

    console.log('\nPerformance monitoring completed');
    return this.generateReport();
  }

  async measureEndpoint(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer test-token-for-monitoring'
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        endpoint,
        url,
        responseTime,
        status: response.status,
        contentLength: response.headers['content-length'] || 0,
        success: true
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        endpoint,
        url,
        responseTime,
        status: error.response ? error.response.status : null,
        contentLength: 0,
        success: false,
        error: error.message
      };
    }
  }

  generateReport() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(this.reportDir, `performance-report-${timestamp}.json`);
    const summaryFile = path.join(this.reportDir, `performance-summary-${timestamp}.txt`);

    // Generate detailed JSON report
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));

    // Generate summary report
    const summary = this.analyzePerfgormance();
    fs.writeFileSync(summaryFile, this.formatSummary(summary));

    console.log(`\nReports generated:`);
    console.log(`- Detailed: ${reportFile}`);
    console.log(`- Summary: ${summaryFile}`);

    this.printSummary(summary);
    return summary;
  }

  analyzePerfgormance() {
    const endpointStats = {};

    // Group results by endpoint
    this.results.forEach(result => {
      if (!endpointStats[result.endpoint]) {
        endpointStats[result.endpoint] = {
          endpoint: result.endpoint,
          total: 0,
          successful: 0,
          failed: 0,
          responseTimes: [],
          errors: []
        };
      }

      const stats = endpointStats[result.endpoint];
      stats.total++;

      if (result.success && result.responseTime) {
        stats.successful++;
        stats.responseTimes.push(result.responseTime);
      } else {
        stats.failed++;
        if (result.error) {
          stats.errors.push(result.error);
        }
      }
    });

    // Calculate statistics for each endpoint
    const summary = Object.values(endpointStats).map(stats => {
      const responseTimes = stats.responseTimes;
      
      return {
        endpoint: stats.endpoint,
        total: stats.total,
        successful: stats.successful,
        failed: stats.failed,
        successRate: stats.total > 0 ? (stats.successful / stats.total * 100).toFixed(2) : 0,
        avgResponseTime: responseTimes.length > 0 ? 
          (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) : null,
        minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : null,
        maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : null,
        p95ResponseTime: responseTimes.length > 0 ? 
          this.calculatePercentile(responseTimes, 95).toFixed(2) : null,
        uniqueErrors: [...new Set(stats.errors)]
      };
    });

    return {
      timestamp: new Date().toISOString(),
      duration: this.duration,
      interval: this.interval,
      totalRequests: this.results.length,
      endpoints: summary,
      overall: this.calculateOverallStats(summary)
    };
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  calculateOverallStats(endpointSummaries) {
    const allResponseTimes = [];
    let totalRequests = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    endpointSummaries.forEach(summary => {
      totalRequests += summary.total;
      totalSuccessful += summary.successful;
      totalFailed += summary.failed;
      
      // Reconstruct response times (approximation)
      if (summary.avgResponseTime && summary.successful > 0) {
        for (let i = 0; i < summary.successful; i++) {
          allResponseTimes.push(parseFloat(summary.avgResponseTime));
        }
      }
    });

    return {
      totalRequests,
      totalSuccessful,
      totalFailed,
      overallSuccessRate: totalRequests > 0 ? (totalSuccessful / totalRequests * 100).toFixed(2) : 0,
      avgResponseTime: allResponseTimes.length > 0 ? 
        (allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length).toFixed(2) : null
    };
  }

  formatSummary(summary) {
    let report = `Performance Monitoring Report\n`;
    report += `================================\n\n`;
    report += `Timestamp: ${summary.timestamp}\n`;
    report += `Duration: ${summary.duration / 1000} seconds\n`;
    report += `Interval: ${summary.interval / 1000} seconds\n`;
    report += `Total Requests: ${summary.totalRequests}\n\n`;

    report += `Overall Statistics:\n`;
    report += `------------------\n`;
    report += `Success Rate: ${summary.overall.overallSuccessRate}%\n`;
    report += `Average Response Time: ${summary.overall.avgResponseTime}ms\n`;
    report += `Total Successful: ${summary.overall.totalSuccessful}\n`;
    report += `Total Failed: ${summary.overall.totalFailed}\n\n`;

    report += `Endpoint Statistics:\n`;
    report += `-------------------\n`;

    summary.endpoints.forEach(endpoint => {
      report += `\n${endpoint.endpoint}:\n`;
      report += `  Total Requests: ${endpoint.total}\n`;
      report += `  Success Rate: ${endpoint.successRate}%\n`;
      report += `  Avg Response Time: ${endpoint.avgResponseTime}ms\n`;
      report += `  Min Response Time: ${endpoint.minResponseTime}ms\n`;
      report += `  Max Response Time: ${endpoint.maxResponseTime}ms\n`;
      report += `  95th Percentile: ${endpoint.p95ResponseTime}ms\n`;
      
      if (endpoint.uniqueErrors.length > 0) {
        report += `  Errors: ${endpoint.uniqueErrors.join(', ')}\n`;
      }
    });

    return report;
  }

  printSummary(summary) {
    console.log('\n=== Performance Summary ===');
    console.log(`Total Requests: ${summary.totalRequests}`);
    console.log(`Overall Success Rate: ${summary.overall.overallSuccessRate}%`);
    console.log(`Average Response Time: ${summary.overall.avgResponseTime}ms`);

    console.log('\nEndpoint Performance:');
    summary.endpoints.forEach(endpoint => {
      const status = parseFloat(endpoint.successRate) >= 95 ? '✅' : '⚠️';
      console.log(`${status} ${endpoint.endpoint}: ${endpoint.successRate}% success, ${endpoint.avgResponseTime}ms avg`);
    });

    // Performance warnings
    const warnings = [];
    summary.endpoints.forEach(endpoint => {
      if (parseFloat(endpoint.successRate) < 95) {
        warnings.push(`${endpoint.endpoint} has low success rate: ${endpoint.successRate}%`);
      }
      if (parseFloat(endpoint.avgResponseTime) > 2000) {
        warnings.push(`${endpoint.endpoint} has slow response time: ${endpoint.avgResponseTime}ms`);
      }
    });

    if (warnings.length > 0) {
      console.log('\n⚠️ Performance Warnings:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    } else {
      console.log('\n✅ All endpoints performing within acceptable limits');
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3001/api',
    duration: parseInt(process.env.DURATION) || 60000,
    interval: parseInt(process.env.INTERVAL) || 5000,
    reportDir: './performance-reports'
  };

  if (args.includes('--help')) {
    console.log(`
Usage: node performance-monitor.js [options]

Options:
  --base-url <url>      Base URL for API (default: http://localhost:3001/api)
  --duration <ms>       Monitoring duration in ms (default: 60000)
  --interval <ms>       Check interval in ms (default: 5000)
  --report-dir <dir>    Report output directory (default: ./performance-reports)
  --help               Show this help message

Environment Variables:
  BASE_URL             Base URL for API
  DURATION             Monitoring duration in ms
  INTERVAL             Check interval in ms
    `);
    return;
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
      case '--base-url':
        options.baseUrl = args[i + 1];
        break;
      case '--duration':
        options.duration = parseInt(args[i + 1]);
        break;
      case '--interval':
        options.interval = parseInt(args[i + 1]);
        break;
      case '--report-dir':
        options.reportDir = args[i + 1];
        break;
    }
  }

  const monitor = new PerformanceMonitor(options);
  
  try {
    await monitor.runMonitoring();
    console.log('\nPerformance monitoring completed successfully!');
  } catch (error) {
    console.error('\nPerformance monitoring failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceMonitor;