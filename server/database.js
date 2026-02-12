import sqlite3 from 'sqlite3'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, 'data', 'urls.db')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message)
  } else {
    console.log('Connected to SQLite database')
  }
})

// Create tables
const createTables = () => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    db.run(`
      CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_id INTEGER NOT NULL,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (url_id) REFERENCES urls(id)
      )
    `)
  })
}

// Database operations
export const dbOperations = {
  // Create new short URL
  createShortUrl: (url, code) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO urls (original_url, code) VALUES (?, ?)')
      stmt.run([url, code], function(err) {
        if (err) reject(err)
        else resolve({ id: this.lastID, code })
      })
      stmt.finalize()
    })
  },

  // Get original URL by code
  getUrlByCode: (code) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM urls WHERE code = ?', [code], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  // Track click
  trackClick: (urlId, ipAddress, userAgent) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO clicks (url_id, ip_address, user_agent) VALUES (?, ?, ?)')
      stmt.run([urlId, ipAddress, userAgent], function(err) {
        if (err) reject(err)
        else resolve(this.lastID)
      })
      stmt.finalize()
    })
  },

  // Get analytics for a URL
  getAnalytics: (code) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.id,
          u.code,
          u.original_url,
          u.created_at,
          COUNT(c.id) as click_count
        FROM urls u
        LEFT JOIN clicks c ON u.id = c.url_id
        WHERE u.code = ?
        GROUP BY u.id
      `
      db.get(query, [code], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  // Get overall stats
  getOverallStats: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(DISTINCT u.id) as total_urls,
          COUNT(c.id) as total_clicks
        FROM urls u
        LEFT JOIN clicks c ON u.id = c.url_id
      `
      db.get(query, [], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  },

  // Get recent clicks
  getRecentClicks: (limit = 10) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.code,
          u.original_url,
          c.clicked_at,
          c.ip_address,
          c.user_agent
        FROM clicks c
        JOIN urls u ON c.url_id = u.id
        ORDER BY c.clicked_at DESC
        LIMIT ?
      `
      db.all(query, [limit], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }
}

// Initialize database
createTables()

export default db