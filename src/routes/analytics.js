const express = require('express');
const router = express.Router();
const URLService = require('../utils/URLService');

/**
 * GET /api/analytics/:code
 * Get analytics for a specific short URL
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const analytics = URLService.getAnalytics(code);

    if (!analytics) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/analytics
 * Get overview analytics for all URLs
 */
router.get('/', async (req, res) => {
  try {
    const urls = URLService.getAllUrls();
    
    const overview = {
      totalUrls: urls.length,
      totalClicks: urls.reduce((sum, url) => sum + url.clicks, 0),
      averageClicksPerUrl: urls.length > 0 ? Math.round(urls.reduce((sum, url) => sum + url.clicks, 0) / urls.length) : 0,
      topUrls: urls
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
        .map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          clicks: url.clicks
        }))
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;