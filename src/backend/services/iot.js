// MQTT for rig/Guyana monitoring
const mqtt = require('mqtt');
const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://localhost:1883');
client.on('connect', () => client.subscribe('rig/monitor'));
client.on('message', (topic, msg) => {
  // Handle rig data
});
module.exports = client;
