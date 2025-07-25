// Global test setup and configuration
const { TextEncoder, TextDecoder } = require('util');

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock console methods for cleaner test output if needed
if (process.env.NODE_ENV === 'test') {
  // Uncomment to suppress console output during tests
  // jest.spyOn(console, 'log').mockImplementation(() => {});
  // jest.spyOn(console, 'warn').mockImplementation(() => {});
}

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});