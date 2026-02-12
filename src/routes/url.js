const express = require('express');
const router = express.Router();
const URLService = require('../utils/URLService');

/**
 * POST /api/url/shorten
 * Create a short URL
 * Body: { url: string, customCode?: string }
 */
router.post('/shorten', async (req, res) => {
  try {
    const { url: originalUrl, customCode } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    const urlEntry = URLService.createShortUrl(originalUrl, customCode);

    res.status(201).json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl: urlEntry.originalUrl,
        shortCode: urlEntry.shortCode,
        shortUrl: `${req.protocol}://${req.get('host')}/${urlEntry.shortCode}`,
        createdAt: urlEntry.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/url/:code
 * Get URL information by short code
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const urlEntry = URLService.getUrlByCode(code);

    if (!urlEntry) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }

    res.json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl: urlEntry.originalUrl,
        shortCode: urlEntry.shortCode,
        shortUrl: `${req.protocol}://${req.get('host')}/${urlEntry.shortCode}`,
        createdAt: urlEntry.createdAt,
        clicks: urlEntry.clicks
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/url/:code
 * Delete a short URL
 */
router.delete('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const deleted = URLService.deleteUrl(code);

    if (!deleted) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }

    res.json({
      success: true,
      message: 'Short URL deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/url
 * Get all URLs (admin endpoint)
 */
router.get('/', async (req, res) => {
  try {
    const urls = URLService.getAllUrls();
    
    res.json({
      success: true,
      data: urls.map(url => ({
        ...url,
        shortUrl: `${req.protocol}://${req.get('host')}/${url.shortCode}`
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;