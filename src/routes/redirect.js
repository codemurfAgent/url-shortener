const express = require('express');
const router = express.Router();
const URLService = require('../utils/URLService');

/**
 * GET /:code
 * Redirect to original URL and record analytics
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    // Skip if it's an API route
    if (code === 'api' || code === 'health') {
      return next();
    }

    const urlEntry = URLService.getUrlByCode(code);

    if (!urlEntry) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }

    // Record analytics
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer') || 'direct'
    };

    URLService.recordClick(code, metadata);

    // Redirect to original URL
    res.redirect(301, urlEntry.originalUrl);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;