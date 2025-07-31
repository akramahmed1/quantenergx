import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')
  
  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.PLAYWRIGHT_TEST_BASE_URL = config.projects[0].use?.baseURL || 'http://localhost:3000'
  
  // Create test artifacts directory
  const fs = require('fs')
  const path = require('path')
  
  const artifactsDir = path.join(__dirname, '../test-logs')
  const screenshotsDir = path.join(artifactsDir, 'screenshots')
  const videosDir = path.join(artifactsDir, 'videos')
  const reportsDir = path.join(artifactsDir, 'reports')
  
  // Ensure directories exist
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true })
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })
  if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true })
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true })
  
  // Set up test database or mock services if needed
  // await setupTestDatabase()
  // await startMockServices()
  
  console.log('✅ Global test setup completed')
}

export default globalSetup