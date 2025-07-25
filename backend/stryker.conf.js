/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
module.exports = {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "jest",
  jest: {
    projectType: "custom",
    configFile: "jest.config.js",
    enableFindRelatedTests: true,
  },
  coverageAnalysis: "perTest",
  mutate: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
    "!src/server.js",        // Don't mutate server startup
    "!src/config/**",        // Don't mutate configuration
    "!src/middleware/logger.js"  // Don't mutate logging
  ],
  thresholds: {
    high: 80,
    low: 70,
    break: 60
  },
  htmlReporter: {
    fileName: "test/mutation/reports/mutation-report.html"
  },
  tempDirName: "test/mutation/.stryker-tmp",
  cleanTempDir: true,
  concurrency: 2,
  timeoutMS: 60000,
  timeoutFactor: 2,
  maxConcurrentTestRunners: 1,
  disableTypeChecking: true,
  ignorePatterns: [
    "node_modules",
    "test",
    "dist",
    "build",
    "coverage",
    ".git"
  ],
  plugins: [
    "@stryker-mutator/jest-runner"
  ]
};