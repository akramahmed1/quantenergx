/**
 * QuantEnergx Backend Entry Point
 * 
 * This is the main entry point for the QuantEnergx backend application.
 * It imports and starts the Express server with all middleware and routes configured.
 */

// Import the existing server configuration from the source directory
const app = require('../src/server.js');

// Export the app for testing purposes
export default app;

// The server is started in server.js if not in test mode