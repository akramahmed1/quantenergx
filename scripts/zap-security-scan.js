#!/usr/bin/env node

/**
 * OWASP ZAP Security Scanner Integration
 * 
 * This script automates security scanning using OWASP ZAP
 * for the QuantEnergx backend API.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ZAPSecurityScanner {
  constructor(options = {}) {
    this.zapPort = options.zapPort || 8080;
    this.targetUrl = options.targetUrl || 'http://localhost:3001';
    this.apiKey = options.apiKey || process.env.ZAP_API_KEY;
    this.zapProxy = `http://localhost:${this.zapPort}`;
    this.reportDir = options.reportDir || './security-reports';
    this.zapProcess = null;
  }

  async startZAP() {
    console.log('Starting OWASP ZAP...');
    
    try {
      // Start ZAP in daemon mode
      this.zapProcess = spawn('zap.sh', [
        '-daemon',
        '-port', this.zapPort.toString(),
        '-config', 'api.addrs.addr.name=.*',
        '-config', 'api.addrs.addr.regex=true',
        '-config', 'api.key=' + (this.apiKey || '')
      ], {
        stdio: 'pipe',
        detached: false
      });

      // Wait for ZAP to start
      await this.waitForZAP();
      console.log('OWASP ZAP started successfully');
    } catch (error) {
      console.error('Failed to start ZAP:', error.message);
      throw error;
    }
  }

  async waitForZAP(maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(`${this.zapProxy}/JSON/core/view/version/`, {
          timeout: 1000
        });
        
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        // ZAP not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('ZAP failed to start within timeout period');
  }

  async stopZAP() {
    if (this.zapProcess) {
      console.log('Stopping OWASP ZAP...');
      this.zapProcess.kill('SIGTERM');
      this.zapProcess = null;
    }
  }

  async runSpiderScan() {
    console.log('Running spider scan...');
    
    try {
      // Start spider scan
      const spiderResponse = await axios.get(`${this.zapProxy}/JSON/spider/action/scan/`, {
        params: {
          url: this.targetUrl,
          maxChildren: 10,
          recurse: true,
          contextName: '',
          subtreeOnly: false
        }
      });

      const scanId = spiderResponse.data.scan;
      console.log(`Spider scan started with ID: ${scanId}`);

      // Wait for spider scan to complete
      await this.waitForScanCompletion('spider', scanId);
      console.log('Spider scan completed');

      return scanId;
    } catch (error) {
      console.error('Spider scan failed:', error.message);
      throw error;
    }
  }

  async runActiveScan() {
    console.log('Running active security scan...');
    
    try {
      // Start active scan
      const scanResponse = await axios.get(`${this.zapProxy}/JSON/ascan/action/scan/`, {
        params: {
          url: this.targetUrl,
          recurse: true,
          inScopeOnly: false,
          scanPolicyName: '',
          method: 'GET',
          postData: ''
        }
      });

      const scanId = scanResponse.data.scan;
      console.log(`Active scan started with ID: ${scanId}`);

      // Wait for active scan to complete
      await this.waitForScanCompletion('ascan', scanId);
      console.log('Active scan completed');

      return scanId;
    } catch (error) {
      console.error('Active scan failed:', error.message);
      throw error;
    }
  }

  async waitForScanCompletion(scanType, scanId, maxWaitTime = 600000) {
    const startTime = Date.now();
    let progress = 0;
    
    while (Date.now() - startTime < maxWaitTime && progress < 100) {
      try {
        const endpoint = scanType === 'spider' ? 'spider' : 'ascan';
        const response = await axios.get(`${this.zapProxy}/JSON/${endpoint}/view/status/`, {
          params: { scanId }
        });

        progress = parseInt(response.data.status);
        console.log(`${scanType} scan progress: ${progress}%`);
        
        if (progress < 100) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Error checking ${scanType} scan status:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    if (progress < 100) {
      throw new Error(`${scanType} scan timeout`);
    }
  }

  async generateReports() {
    console.log('Generating security reports...');
    
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }

    try {
      // Generate HTML report
      const htmlReport = await axios.get(`${this.zapProxy}/OTHER/core/other/htmlreport/`);
      fs.writeFileSync(
        path.join(this.reportDir, 'zap-security-report.html'),
        htmlReport.data
      );

      // Generate JSON report
      const jsonReport = await axios.get(`${this.zapProxy}/JSON/core/view/alerts/`);
      fs.writeFileSync(
        path.join(this.reportDir, 'zap-security-report.json'),
        JSON.stringify(jsonReport.data, null, 2)
      );

      // Generate XML report
      const xmlReport = await axios.get(`${this.zapProxy}/OTHER/core/other/xmlreport/`);
      fs.writeFileSync(
        path.join(this.reportDir, 'zap-security-report.xml'),
        xmlReport.data
      );

      console.log(`Reports generated in: ${this.reportDir}`);
      
      return this.analyzeResults(jsonReport.data);
    } catch (error) {
      console.error('Failed to generate reports:', error.message);
      throw error;
    }
  }

  analyzeResults(alertData) {
    const alerts = alertData.alerts || [];
    const summary = {
      total: alerts.length,
      high: 0,
      medium: 0,
      low: 0,
      informational: 0
    };

    alerts.forEach(alert => {
      switch (alert.risk) {
        case 'High':
          summary.high++;
          break;
        case 'Medium':
          summary.medium++;
          break;
        case 'Low':
          summary.low++;
          break;
        case 'Informational':
          summary.informational++;
          break;
      }
    });

    console.log('\n=== Security Scan Summary ===');
    console.log(`Total Alerts: ${summary.total}`);
    console.log(`High Risk: ${summary.high}`);
    console.log(`Medium Risk: ${summary.medium}`);
    console.log(`Low Risk: ${summary.low}`);
    console.log(`Informational: ${summary.informational}`);

    // Set exit code based on findings
    if (summary.high > 0) {
      console.log('\n⚠️  HIGH RISK vulnerabilities found!');
      process.exitCode = 1;
    } else if (summary.medium > 0) {
      console.log('\n⚠️  MEDIUM RISK vulnerabilities found!');
      process.exitCode = 1;
    } else {
      console.log('\n✅ No high or medium risk vulnerabilities found.');
    }

    return summary;
  }

  async runFullScan() {
    try {
      await this.startZAP();
      
      // Configure authentication if needed
      await this.configureAuthentication();
      
      // Run spider scan first
      await this.runSpiderScan();
      
      // Run active security scan
      await this.runActiveScan();
      
      // Generate reports
      const results = await this.generateReports();
      
      return results;
    } catch (error) {
      console.error('Security scan failed:', error.message);
      throw error;
    } finally {
      await this.stopZAP();
    }
  }

  async configureAuthentication() {
    // Configure authentication for protected endpoints
    try {
      console.log('Configuring authentication...');
      
      // Set up authentication script
      await axios.get(`${this.zapProxy}/JSON/authentication/action/setAuthenticationMethod/`, {
        params: {
          contextId: 0,
          authMethodName: 'httpAuthentication',
          authMethodConfigParams: 'hostname=localhost&realm=&port=3001'
        }
      });

      console.log('Authentication configured');
    } catch (error) {
      console.warn('Authentication configuration failed:', error.message);
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    targetUrl: process.env.TARGET_URL || 'http://localhost:3001',
    zapPort: parseInt(process.env.ZAP_PORT) || 8080,
    reportDir: './security-reports'
  };

  if (args.includes('--help')) {
    console.log(`
Usage: node zap-security-scan.js [options]

Options:
  --target-url <url>    Target URL to scan (default: http://localhost:3001)
  --zap-port <port>     ZAP proxy port (default: 8080)
  --report-dir <dir>    Report output directory (default: ./security-reports)
  --help               Show this help message

Environment Variables:
  TARGET_URL           Target URL to scan
  ZAP_PORT            ZAP proxy port
  ZAP_API_KEY         ZAP API key for authentication
    `);
    return;
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
      case '--target-url':
        options.targetUrl = args[i + 1];
        break;
      case '--zap-port':
        options.zapPort = parseInt(args[i + 1]);
        break;
      case '--report-dir':
        options.reportDir = args[i + 1];
        break;
    }
  }

  console.log('Starting OWASP ZAP Security Scan...');
  console.log(`Target URL: ${options.targetUrl}`);
  console.log(`ZAP Port: ${options.zapPort}`);
  console.log(`Report Directory: ${options.reportDir}`);

  const scanner = new ZAPSecurityScanner(options);
  
  try {
    const results = await scanner.runFullScan();
    console.log('\nSecurity scan completed successfully!');
    console.log(`Reports available in: ${options.reportDir}`);
  } catch (error) {
    console.error('\nSecurity scan failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ZAPSecurityScanner;