const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerConfig = require('./swagger/config');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 100 });
const app = express();
app.use(helmet());
app.use(rateLimit({ windowMs: 60000, max: 1000 }));
app.use(slowDown({ windowMs: 60000, delayAfter: 100, delayMs: 500 }));
app.use(express.json());

// Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(swaggerConfig)));

// Auth/RBAC
const jwt = require('jsonwebtoken');
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Trading
app.post('/api/v1/trades', authMiddleware, async (req, res) => {
  const { commodity, quantity, price, market, userId } = req.body;
  if (market === 'middle-east' && price.includes('interest')) return res.status(400).json({ error: 'Sharia violation' });
  await pool.query('INSERT INTO trades VALUES ($1, $2, $3, $4, $5)', [commodity, quantity, price, market, userId]);
  res.status(201).json({ success: true });
});

// Risk
const tf = require('@tensorflow/tfjs');
app.get('/api/v1/risk/var', authMiddleware, async (req, res) => {
  const model = await tf.loadLayersModel('model.json');
  const varValue = model.predict(tf.tensor([req.body.portfolio])).dataSync()[0];
  res.json({ var: varValue });
});

// Compliance
app.get('/api/v1/compliance/check', authMiddleware, (req, res) => {
  res.json({ compliant: true });
});

module.exports = app;