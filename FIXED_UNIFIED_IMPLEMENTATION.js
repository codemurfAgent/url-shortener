// 🚀 FIXED UNIFIED URL SHORTENER IMPLEMENTATION
// This file provides a complete, production-ready solution

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg'); // PostgreSQL for production

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/urlshortener',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        original_url TEXT NOT NULL,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        clicks INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
        ip_address INET,
        user_agent TEXT,
        referer TEXT,
        country VARCHAR(2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
      CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON analytics(url_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Utility functions
class URLService {
  static async createShortUrl(originalUrl, customCode = null) {
    // Validate URL
    try {
      new URL(originalUrl);
    } catch (error) {
      throw new Error('Invalid URL provided');
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate or validate custom code
      let shortCode = customCode;
      if (!shortCode) {
        // Generate unique code
        shortCode = Math.random().toString(36).substring(2, 8);
        
        // Ensure uniqueness
        const existing = await client.query(
          'SELECT id FROM urls WHERE short_code = $1',
          [shortCode]
        );
        
        if (existing.rows.length > 0) {
          // Regenerate if collision
          shortCode = Math.random().toString(36).substring(2, 8);
        }
      } else {
        // Check if custom code exists
        const existing = await client.query(
          'SELECT id FROM urls WHERE short_code = $1',
          [shortCode]
        );
        
        if (existing.rows.length > 0) {
          throw new Error('Custom code already exists');
        }
      }

      // Insert URL
      const result = await client.query(
        `INSERT INTO urls (original_url, short_code) 
         VALUES ($1, $2) 
         RETURNING id, original_url, short_code, created_at, clicks`,
        [originalUrl, shortCode]
      );

      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUrlByCode(shortCode) {
    const result = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );
    return result.rows[0] || null;
  }

  static async recordClick(urlId, metadata) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Increment click count
      await client.query(
        'UPDATE urls SET clicks = clicks + 1 WHERE id = $1',
        [urlId]
      );

      // Record analytics
      await client.query(
        `INSERT INTO analytics (url_id, ip_address, user_agent, referer, country)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          urlId,
          metadata.ip,
          metadata.userAgent,
          metadata.referer,
          metadata.country
        ]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error recording click:', error);
      return false;
    } finally {
      client.release();
    }
  }

  static async getAnalytics(shortCode) {
    const urlResult = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (urlResult.rows.length === 0) {
      return null;
    }

    const url = urlResult.rows[0];

    // Get analytics
    const analyticsResult = await pool.query(
      `SELECT * FROM analytics 
       WHERE url_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [url.id]
    );

    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const todayClicks = analyticsResult.rows.filter(click => 
      click.created_at.toISOString().startsWith(today)
    ).length;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysClicks = analyticsResult.rows.filter(click => 
      click.created_at >= last7Days
    ).length;

    const uniqueIPs = new Set(analyticsResult.rows.map(click => click.ip_address));

    return {
      shortCode: url.short_code,
      originalUrl: url.original_url,
      totalClicks: url.clicks,
      uniqueVisitors: uniqueIPs.size,
      todayClicks,
      last7DaysClicks,
      createdAt: url.created_at,
      recentClicks: analyticsResult.rows.slice(0, 10)
    };
  }

  static async getAllUrls() {
    const result = await pool.query(
      'SELECT * FROM urls ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async deleteUrl(shortCode) {
    const result = await pool.query(
      'DELETE FROM urls WHERE short_code = $1',
      [shortCode]
    );
    return result.rowCount > 0;
  }
}

// API Routes

// Health check
app.get('/health', async (req, res) => {
  try {
    const dbTest = await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: '2.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// URL Management Routes
app.post('/api/url/shorten', async (req, res) => {
  try {
    const { url: originalUrl, customCode } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    const urlEntry = await URLService.createShortUrl(originalUrl, customCode);

    res.status(201).json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl: urlEntry.original_url,
        shortCode: urlEntry.short_code,
        shortUrl: `${req.protocol}://${req.get('host')}/${urlEntry.short_code}`,
        createdAt: urlEntry.created_at
      }
    });
  } catch (error) {
    console.error('Create URL error:', error);
    res.status(400).json({ 
      error: error.message || 'Failed to create short URL' 
    });
  }
});

app.get('/api/url/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const urlEntry = await URLService.getUrlByCode(code);

    if (!urlEntry) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }

    res.json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl: urlEntry.original_url,
        shortCode: urlEntry.short_code,
        shortUrl: `${req.protocol}://${req.get('host')}/${urlEntry.short_code}`,
        createdAt: urlEntry.created_at,
        clicks: urlEntry.clicks
      }
    });
  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.delete('/api/url/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const deleted = await URLService.deleteUrl(code);

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
    console.error('Delete URL error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.get('/api/url', async (req, res) => {
  try {
    const urls = await URLService.getAllUrls();
    
    res.json({
      success: true,
      data: urls.map(url => ({
        id: url.id,
        originalUrl: url.original_url,
        shortCode: url.short_code,
        shortUrl: `${req.protocol}://${req.get('host')}/${url.short_code}`,
        createdAt: url.created_at,
        clicks: url.clicks
      }))
    });
  } catch (error) {
    console.error('List URLs error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Analytics Routes
app.get('/api/analytics/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const analytics = await URLService.getAnalytics(code);

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
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const urls = await URLService.getAllUrls();
    
    const overview = {
      totalUrls: urls.length,
      totalClicks: urls.reduce((sum, url) => sum + url.clicks, 0),
      averageClicksPerUrl: urls.length > 0 ? Math.round(urls.reduce((sum, url) => sum + url.clicks, 0) / urls.length) : 0,
      topUrls: urls
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5)
        .map(url => ({
          shortCode: url.short_code,
          originalUrl: url.original_url,
          clicks: url.clicks
        }))
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Redirect Route (Must be last)
app.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    
    // Skip API routes and static files
    if (code === 'api' || code === 'health' || code.includes('.') || code.includes('-')) {
      return next();
    }

    const urlEntry = await URLService.getUrlByCode(code);

    if (!urlEntry) {
      return res.status(404).json({ 
        error: 'Short URL not found' 
      });
    }

    // Record analytics
    const metadata = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer') || 'direct',
      country: req.get('X-Country') || 'unknown'
    };

    await URLService.recordClick(urlEntry.id, metadata);

    // Redirect to original URL
    res.redirect(301, urlEntry.original_url);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 URL Shortener v2.0.0 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);

module.exports = app;

// Environment variables needed:
// DATABASE_URL=postgresql://username:password@host:port/database
// PORT=3000 (optional)
// NODE_ENV=production (for production)