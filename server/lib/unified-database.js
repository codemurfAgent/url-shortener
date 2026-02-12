// 🗄️ Unified Database Solution - Solves Data Isolation
// SHARED POSTGRESQL DATABASE FOR ALL VERCEL FUNCTIONS

import { Pool } from '@vercel/postgres';

// Global connection pool - shared across all functions
let globalPool = null;
let isInitialized = false;

// Get or create global database instance
function getDatabase() {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: { rejectUnauthorized: false }
    });
  }
  return globalPool;
}

class UnifiedDatabase {
  constructor() {
    this.pool = getDatabase();
  }

  // Initialize database (only once per deployment)
  async initialize() {
    if (isInitialized) return;
    
    const pool = this.pool;
    
    try {
      // Create tables if they don't exist
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
          city VARCHAR(100),
          region VARCHAR(100),
          device_type VARCHAR(20),
          browser VARCHAR(50),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create indexes for performance
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
        CREATE INDEX IF NOT EXISTS idx_analytics_url_id ON analytics(url_id);
        CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
        CREATE INDEX IF NOT EXISTS idx_analytics_country ON analytics(country);
      `);

      isInitialized = true;
      console.log('✅ Unified database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Create short URL with proper error handling
  async createUrl(originalUrl, customCode = null) {
    await this.initialize();

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch (urlError) {
        throw new Error('Invalid URL provided');
      }

      // Generate or validate short code
      let shortCode = customCode;
      if (!shortCode) {
        // Generate unique code
        do {
          shortCode = Math.random().toString(36).substring(2, 8);
          const existing = await client.query(
            'SELECT id FROM urls WHERE short_code = $1',
            [shortCode]
          );
          if (existing.rows.length === 0) break;
        } while (true);
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
      
      console.log(`✅ Created URL: ${shortCode} → ${originalUrl}`);
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Create URL error:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get URL by short code
  async getUrlByCode(shortCode) {
    await this.initialize();
    
    const result = await this.pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );
    
    const url = result.rows[0];
    if (url) {
      console.log(`✅ Found URL: ${shortCode} → ${url.original_url}`);
    }
    
    return url || null;
  }

  // Record click with rich analytics
  async recordClick(shortCode, metadata) {
    await this.initialize();
    
    const urlEntry = await this.getUrlByCode(shortCode);
    if (!urlEntry) {
      console.warn(`❌ URL not found for analytics: ${shortCode}`);
      return false;
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Increment click count
      await client.query(
        'UPDATE urls SET clicks = clicks + 1 WHERE id = $1',
        [urlEntry.id]
      );

      // Parse user agent for device/browser detection
      const userAgent = metadata.userAgent || '';
      const deviceType = userAgent.includes('Mobile') ? 'mobile' : 
                        userAgent.includes('Tablet') ? 'tablet' : 'desktop';
      const browser = userAgent.includes('Chrome') ? 'chrome' :
                     userAgent.includes('Firefox') ? 'firefox' :
                     userAgent.includes('Safari') ? 'safari' :
                     userAgent.includes('Edge') ? 'edge' : 'unknown';

      // Record detailed analytics
      await client.query(
        `INSERT INTO analytics 
         (url_id, ip_address, user_agent, referer, country, city, region, device_type, browser)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          urlEntry.id,
          metadata.ip || 'unknown',
          metadata.userAgent || 'unknown',
          metadata.referer || 'direct',
          metadata.country || 'unknown',
          metadata.city || 'unknown',
          metadata.region || 'unknown',
          deviceType,
          browser
        ]
      );

      await client.query('COMMIT');
      
      console.log(`✅ Recorded click: ${shortCode} from ${metadata.country || 'unknown'}`);
      return true;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Record click error:', error.message);
      return false;
    } finally {
      client.release();
    }
  }

  // Get comprehensive analytics
  async getAnalytics(shortCode, period = '7d') {
    await this.initialize();
    
    const urlResult = await this.pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (urlResult.rows.length === 0) return null;

    const url = urlResult.rows[0];

    // Calculate period filter
    const periodDays = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    }[period] || 7;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    // Get analytics with period filter
    const analyticsResult = await this.pool.query(
      `SELECT * FROM analytics 
       WHERE url_id = $1 AND created_at >= $2
       ORDER BY created_at DESC 
       LIMIT 1000`,
      [url.id, cutoffDate]
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
    const uniqueCountries = new Set(analyticsResult.rows.map(click => click.country).filter(c => c && c !== 'unknown'));

    // Geographic breakdown
    const countryBreakdown = {};
    analyticsResult.rows.forEach(click => {
      const country = click.country || 'unknown';
      countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
    });

    // Device breakdown
    const deviceBreakdown = {};
    analyticsResult.rows.forEach(click => {
      const device = click.device_type || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    // Browser breakdown
    const browserBreakdown = {};
    analyticsResult.rows.forEach(click => {
      const browser = click.browser || 'unknown';
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
    });

    // Top referers
    const refererBreakdown = {};
    analyticsResult.rows.forEach(click => {
      const referer = click.referer || 'direct';
      refererBreakdown[referer] = (refererBreakdown[referer] || 0) + 1;
    });

    return {
      shortCode: url.short_code,
      originalUrl: url.original_url,
      totalClicks: url.clicks,
      uniqueVisitors: uniqueIPs.size,
      uniqueCountries: uniqueCountries.size,
      periodClicks: analyticsResult.rows.length,
      todayClicks,
      last7DaysClicks,
      createdAt: url.created_at,
      recentClicks: analyticsResult.rows.slice(0, 20),
      breakdowns: {
        countries: countryBreakdown,
        devices: deviceBreakdown,
        browsers: browserBreakdown,
        referers: refererBreakdown
      }
    };
  }

  // Get overview analytics for all URLs
  async getOverviewAnalytics() {
    await this.initialize();
    
    // Get all URLs with their stats
    const urlsResult = await this.pool.query(
      'SELECT * FROM urls ORDER BY created_at DESC'
    );

    const totalUrls = urlsResult.rows.length;
    const totalClicks = urlsResult.rows.reduce((sum, url) => sum + url.clicks, 0);
    const averageClicksPerUrl = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;

    // Get recent analytics data
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentAnalyticsResult = await this.pool.query(
      `SELECT a.*, u.short_code 
       FROM analytics a 
       JOIN urls u ON a.url_id = u.id
       WHERE a.created_at >= $1
       ORDER BY a.created_at DESC 
       LIMIT 1000`,
      [last24Hours]
    );

    // Top performing URLs
    const topUrls = urlsResult.rows
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)
      .map(url => ({
        shortCode: url.short_code,
        originalUrl: url.original_url,
        clicks: url.clicks,
        createdAt: url.created_at
      }));

    // Geographic distribution
    const countryStats = {};
    recentAnalyticsResult.rows.forEach(click => {
      const country = click.country || 'unknown';
      countryStats[country] = (countryStats[country] || 0) + 1;
    });

    // Device distribution
    const deviceStats = {};
    recentAnalyticsResult.rows.forEach(click => {
      const device = click.device_type || 'unknown';
      deviceStats[device] = (deviceStats[device] || 0) + 1;
    });

    return {
      totalUrls,
      totalClicks,
      averageClicksPerUrl,
      activeUrls: urlsResult.rows.filter(url => url.clicks > 0).length,
      recentClicks: recentAnalyticsResult.rows.length,
      uniqueVisitors: new Set(recentAnalyticsResult.rows.map(click => click.ip_address)).size,
      topUrls,
      distributions: {
        countries: Object.entries(countryStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        devices: deviceStats,
        recentActivity: recentAnalyticsResult.rows.slice(0, 20)
      }
    };
  }

  // Delete URL with cascade
  async deleteUrl(shortCode) {
    await this.initialize();
    
    const result = await this.pool.query(
      'DELETE FROM urls WHERE short_code = $1',
      [shortCode]
    );
    
    const deleted = result.rowCount > 0;
    if (deleted) {
      console.log(`✅ Deleted URL: ${shortCode}`);
    }
    
    return deleted;
  }

  // Health check with comprehensive status
  async healthCheck() {
    try {
      await this.initialize();
      
      // Test database connection
      const timeResult = await this.pool.query('SELECT NOW() as server_time');
      
      // Get database statistics
      const statsResult = await this.pool.query(`
        SELECT 
          COUNT(*) as total_urls,
          SUM(clicks) as total_clicks
        FROM urls
      `);

      const analyticsResult = await this.pool.query('SELECT COUNT(*) as total_analytics FROM analytics');

      return {
        status: 'OK',
        database: 'connected',
        serverTime: timeResult.rows[0].server_time,
        stats: {
          totalUrls: parseInt(statsResult.rows[0].total_urls),
          totalClicks: parseInt(statsResult.rows[0].total_clicks) || 0,
          totalAnalytics: parseInt(analyticsResult.rows[0].total_analytics)
        },
        version: 'unified-v2.1.0',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      return {
        status: 'ERROR',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const db = new UnifiedDatabase();
export default db;