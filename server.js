const express = require('express');
const { nanoid } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for URL mappings
const urlDatabase = {};

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper: Validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// API: Shorten a URL
app.post('/api/shorten', (req, res) => {
  const { url } = req.body;

  // Validate input
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Generate short code
  const shortCode = nanoid(8);

  // Store in database
  urlDatabase[shortCode] = {
    originalUrl: url,
    shortCode: shortCode,
    createdAt: new Date().toISOString(),
    clicks: 0
  };

  res.json({
    success: true,
    shortCode: shortCode,
    shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`
  });
});

// API: Get URL details
app.get('/api/info/:code', (req, res) => {
  const { code } = req.params;
  const urlData = urlDatabase[code];

  if (!urlData) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  res.json(urlData);
});

// API: List all URLs
app.get('/api/urls', (req, res) => {
  const urls = Object.values(urlDatabase);
  res.json({
    total: urls.length,
    urls: urls
  });
});

// Redirect: Handle short URL
app.get('/:code', (req, res) => {
  const { code } = req.params;
  const urlData = urlDatabase[code];

  if (!urlData) {
    return res.status(404).json({ error: 'Short URL not found' });
  }

  // Increment click count
  urlData.clicks++;

  // Redirect to original URL
  res.redirect(urlData.originalUrl);
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'URL Shortener API',
    endpoints: {
      'POST /api/shorten': 'Create short URL (body: { url: "https://example.com" })',
      'GET /api/info/:code': 'Get URL details',
      'GET /api/urls': 'List all URLs',
      'GET /:code': 'Redirect to original URL',
      'GET /api/health': 'Health check'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 URL Shortener API running on http://localhost:${PORT}`);
  console.log(`📝 API documentation: http://localhost:${PORT}/`);
});
