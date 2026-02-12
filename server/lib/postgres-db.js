// 🗄️ Production PostgreSQL Database for Vercel Serverless
// SOLVES: Vercel global variable persistence issue

import { Pool } from '@vercel/postgres';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: require
});

class PostgreSQLDatabase {
  constructor() {
    this.initialized = false;
  }

  // Initialize database tables
  async initialize() {
    if (this.initialized) return;
    
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

      this.initialized = true;
      console.log('✅ PostgreSQL database initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Create short URL
  async createUrl(originalUrl, customCode = null) {
    await this.initialize();

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate or validate short code
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

  // Get URL by short code
  async getUrlByCode(shortCode) {
    await this.initialize();
    
    const result = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );
    
    return result.rows[0] || null;
  }

  // Record click analytics
  async recordClick(shortCode, metadata) {
    await this.initialize();
    
    const urlEntry = await this.getUrlByCode(shortCode);
    if (!urlEntry) return false;

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Increment click count
      await client.query(
        'UPDATE urls SET clicks = clicks + 1 WHERE id = $1',
        [urlEntry.id]
      );

      // Record analytics
      await client.query(
        `INSERT INTO analytics (url_id, ip_address, user_agent, referer, country)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          urlEntry.id,
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

  // Get analytics for a URL
  async getAnalytics(shortCode) {
    await this.initialize();
    
    const urlResult = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (urlResult.rows.length === 0) return null;

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

  // Get all URLs
  async getAllUrls() {
    await this.initialize();
    
    const result = await pool.query(
      'SELECT * FROM urls ORDER BY created_at DESC'
    );
    
    return result.rows;
  }

  // Get overview analytics
  async getOverviewAnalytics() {
    await this.initialize();
    
    const allUrls = await this.getAllUrls();
    
    // Get all analytics data
    const analyticsResult = await pool.query(`
      SELECT a.*, u.short_code 
      FROM analytics a 
      JOIN urls u ON a.url_id = u.id
      ORDER BY a.created_at DESC 
      LIMIT 1000
    `);

    const totalUrls = allUrls.length;
    const totalClicks = allUrls.reduce((sum, url) => sum + url.clicks, 0);
    const averageClicksPerUrl = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;

    const topUrls = allUrls
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map(url => ({
        shortCode: url.short_code,
        originalUrl: url.original_url,
        clicks: url.clicks
      }));

    // Calculate unique visitors
    const uniqueVisitors = new Set(analyticsResult.rows.map(click => click.ip_address)).size;

    // Recent activity (last 24 hours)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    const recentClicks = analyticsResult.rows.filter(click => 
      click.created_at >= last24Hours
    ).length;

    return {
      totalUrls,
      totalClicks,
      averageClicksPerUrl,
      topUrls,
      uniqueVisitors,
      recentClicks
    };
  }

  // Delete URL
  async deleteUrl(shortCode) {
    await this.initialize();
    
    const result = await pool.query(
      'DELETE FROM urls WHERE short_code = $1',
      [shortCode]
    );
    
    return result.rowCount > 0;
  }

  // Health check
  async healthCheck() {
    try {
      await this.initialize();
      const result = await pool.query('SELECT NOW()');
      return {
        status: 'OK',
        database: 'connected',
        timestamp: result.rows[0].now
      };
    } catch (error) {
      return {
        status: 'ERROR',
        database: 'disconnected',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const db = new PostgreSQLDatabase();
export default db;