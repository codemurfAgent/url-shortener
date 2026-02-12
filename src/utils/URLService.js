const { nanoid } = require('nanoid');

// In-memory storage (in production, use a database)
const urlDatabase = new Map();
const analyticsDatabase = new Map();

class URLService {
  /**
   * Create a short URL
   * @param {string} originalUrl - The original URL to shorten
   * @param {string} customCode - Optional custom short code
   * @returns {Object} The created URL entry
   */
  static createShortUrl(originalUrl, customCode = null) {
    // Validate URL
    try {
      new URL(originalUrl);
    } catch (error) {
      throw new Error('Invalid URL provided');
    }

    // Generate or use custom code
    let code = customCode;
    if (!code) {
      code = nanoid(6);
    } else {
      // Check if custom code already exists
      if (urlDatabase.has(code)) {
        throw new Error('Custom code already exists');
      }
    }

    // Create URL entry
    const urlEntry = {
      id: Date.now().toString(),
      originalUrl,
      shortCode: code,
      createdAt: new Date().toISOString(),
      clicks: 0
    };

    // Store in database
    urlDatabase.set(code, urlEntry);
    analyticsDatabase.set(code, []);

    return urlEntry;
  }

  /**
   * Get URL entry by short code
   * @param {string} code - The short code
   * @returns {Object|null} The URL entry or null if not found
   */
  static getUrlByCode(code) {
    return urlDatabase.get(code) || null;
  }

  /**
   * Record a click event
   * @param {string} code - The short code
   * @param {Object} metadata - Click metadata (IP, User-Agent, etc.)
   */
  static recordClick(code, metadata = {}) {
    const urlEntry = urlDatabase.get(code);
    if (!urlEntry) return false;

    // Increment click count
    urlEntry.clicks += 1;

    // Record analytics
    const analytics = analyticsDatabase.get(code) || [];
    const clickEvent = {
      timestamp: new Date().toISOString(),
      ip: metadata.ip || 'unknown',
      userAgent: metadata.userAgent || 'unknown',
      referer: metadata.referer || 'unknown',
      country: metadata.country || 'unknown'
    };

    analytics.push(clickEvent);
    analyticsDatabase.set(code, analytics);

    return true;
  }

  /**
   * Get analytics for a short URL
   * @param {string} code - The short code
   * @returns {Object|null} Analytics data or null if not found
   */
  static getAnalytics(code) {
    const urlEntry = urlDatabase.get(code);
    if (!urlEntry) return null;

    const analytics = analyticsDatabase.get(code) || [];

    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const todayClicks = analytics.filter(click => 
      click.timestamp.startsWith(today)
    ).length;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysClicks = analytics.filter(click => 
      new Date(click.timestamp) >= last7Days
    ).length;

    // Unique visitors (approximate by unique IPs)
    const uniqueIPs = new Set(analytics.map(click => click.ip));

    return {
      shortCode: code,
      originalUrl: urlEntry.originalUrl,
      totalClicks: urlEntry.clicks,
      uniqueVisitors: uniqueIPs.size,
      todayClicks,
      last7DaysClicks,
      createdAt: urlEntry.createdAt,
      recentClicks: analytics.slice(-10).reverse() // Last 10 clicks
    };
  }

  /**
   * Get all URLs (for admin purposes)
   * @returns {Array} Array of all URL entries
   */
  static getAllUrls() {
    return Array.from(urlDatabase.values()).map(entry => ({
      id: entry.id,
      originalUrl: entry.originalUrl,
      shortCode: entry.shortCode,
      createdAt: entry.createdAt,
      clicks: entry.clicks
    }));
  }

  /**
   * Delete a URL by short code
   * @param {string} code - The short code
   * @returns {boolean} True if deleted, false if not found
   */
  static deleteUrl(code) {
    const deleted = urlDatabase.delete(code);
    analyticsDatabase.delete(code);
    return deleted;
  }
}

module.exports = URLService;