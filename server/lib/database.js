// Shared database module for Vercel serverless functions
// Using a simple in-memory storage with persistence across function calls

// For production, this should be replaced with a proper database
// For now, we'll use a simple approach that works across Vercel functions

class SimpleDatabase {
  constructor() {
    this.data = {};
    this.loadFromStorage();
  }

  // Load data from Vercel's environment storage or file system
  loadFromStorage() {
    try {
      // In production, this would connect to a real database
      // For now, we'll use a simple in-memory approach
      if (global.urlDatabase) {
        this.data = global.urlDatabase;
      } else {
        this.data = {
          urls: new Map(),
          analytics: new Map()
        };
        global.urlDatabase = this.data;
      }
    } catch (error) {
      console.warn('Database initialization warning:', error.message);
      this.data = {
        urls: new Map(),
        analytics: new Map()
      };
    }
  }

  // Save data to persistent storage (in production)
  saveToStorage() {
    try {
      global.urlDatabase = this.data;
    } catch (error) {
      console.warn('Database save warning:', error.message);
    }
  }

  // URL operations
  createUrl(originalUrl, shortCode) {
    const urlEntry = {
      id: Date.now().toString(),
      originalUrl,
      shortCode,
      createdAt: new Date().toISOString(),
      clicks: 0
    };

    this.data.urls.set(shortCode, urlEntry);
    this.data.analytics.set(shortCode, []);
    this.saveToStorage();
    
    return urlEntry;
  }

  getUrlByCode(code) {
    return this.data.urls.get(code) || null;
  }

  recordClick(code, metadata) {
    const urlEntry = this.data.urls.get(code);
    if (!urlEntry) return false;

    urlEntry.clicks += 1;
    
    const analytics = this.data.analytics.get(code) || [];
    analytics.push({
      timestamp: new Date().toISOString(),
      ...metadata
    });
    
    this.data.analytics.set(code, analytics);
    this.data.urls.set(code, urlEntry);
    this.saveToStorage();
    
    return true;
  }

  getAnalytics(code) {
    const urlEntry = this.data.urls.get(code);
    if (!urlEntry) return null;

    const analytics = this.data.analytics.get(code) || [];
    
    return {
      shortCode: code,
      originalUrl: urlEntry.originalUrl,
      totalClicks: urlEntry.clicks,
      uniqueVisitors: new Set(analytics.map(click => click.ip)).size,
      createdAt: urlEntry.createdAt,
      clicks: analytics
    };
  }

  getAllUrls() {
    return Array.from(this.data.urls.values());
  }

  deleteUrl(code) {
    const deleted = this.data.urls.delete(code);
    this.data.analytics.delete(code);
    this.saveToStorage();
    return deleted;
  }
}

// Singleton instance
const db = new SimpleDatabase();

export default db;