import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 32,
    videosFolder: '../test-logs/videos',
    screenshotOnRunFailure: true,
    screenshotsFolder: '../test-logs/screenshots',
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    watchForFileChanges: false,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      require('@cypress/code-coverage/task')(on, config)
      
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
        table(message) {
          console.table(message)
          return null
        },
        writeFile({ filePath, data }) {
          const fs = require('fs')
          const path = require('path')
          
          const fullPath = path.join(__dirname, filePath)
          const dir = path.dirname(fullPath)
          
          // Ensure directory exists
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          
          fs.writeFileSync(fullPath, JSON.stringify(data, null, 2))
          return null
        },
        readFile(filePath) {
          const fs = require('fs')
          const path = require('path')
          
          try {
            const fullPath = path.join(__dirname, filePath)
            return fs.readFileSync(fullPath, 'utf8')
          } catch (error) {
            return null
          }
        }
      })

      // Configure browser preferences
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          // Optimize Chrome for testing
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--no-sandbox')
          
          // Enable accessibility testing
          launchOptions.args.push('--force-prefers-reduced-motion')
        }
        
        if (browser.name === 'firefox') {
          // Firefox specific optimizations
          launchOptions.preferences['accessibility.force_disabled'] = 0
        }
        
        return launchOptions
      })

      // Handle test results
      on('after:run', (results) => {
        const fs = require('fs')
        const path = require('path')
        
        const reportsDir = path.join(__dirname, '../test-logs/reports')
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true })
        }
        
        // Write detailed test results
        const reportPath = path.join(reportsDir, 'cypress-detailed-results.json')
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
        
        console.log(`📊 Detailed test results written to ${reportPath}`)
        console.log(`📈 Tests: ${results.totalTests}, Passed: ${results.totalPassed}, Failed: ${results.totalFailed}`)
        
        return results
      })

      return config
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    videosFolder: '../test-logs/videos/component',
    screenshotsFolder: '../test-logs/screenshots/component',
  },
  env: {
    coverage: true,
    codeCoverage: {
      exclude: [
        'cypress/**/*.*',
        'src/**/*.test.*',
        'src/**/*.spec.*'
      ]
    },
    // Test user credentials
    testUser: {
      username: 'testuser@quantenergx.com',
      password: 'TestPassword123!'
    },
    // API configuration
    apiUrl: 'http://localhost:3001',
    // Feature flags for testing
    features: {
      realTimeUpdates: true,
      biometricAuth: true,
      offlineMode: true,
      voiceCommands: false
    }
  }
})