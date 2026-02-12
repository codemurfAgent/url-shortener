const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const urlRoutes = require('./routes/url');
const analyticsRoutes = require('./routes/analytics');
const redirectRoutes = require('./routes/redirect');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Redirect route (must be last)
app.use('/', redirectRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 URL Shortener API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;