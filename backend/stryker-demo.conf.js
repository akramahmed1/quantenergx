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
    enableFindRelatedTests: false,
  },
  coverageAnalysis: "off", // Faster for demo
  mutate: [
    "test/unit/core-functions.test.js", // Small file for demo
  ],
  thresholds: {
    high: 50,  // Lower for demo
    low: 30,
    break: 10
  },
  htmlReporter: {
    fileName: "test/mutation/reports/mutation-demo-report.html"
  },
  tempDirName: "test/mutation/.stryker-tmp",
  cleanTempDir: true,
  concurrency: 1,
  timeoutMS: 30000,
  timeoutFactor: 1.5,
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