import pg from 'pg'

const { Pool } = pg

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Initialize database tables
const createTables = async () => {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        user_agent TEXT
      )
    `)

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_urls_code ON urls(code)
    `)

    console.log('PostgreSQL tables created/verified')
  } catch (error) {
    console.error('Error creating tables:', error)
  } finally {
    client.release()
  }
}

// Database operations
export const dbOperations = {
  // Create new short URL
  createShortUrl: async (url, code) => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        'INSERT INTO urls (original_url, code) VALUES ($1, $2) RETURNING id, code',
        [url, code]
      )
      return { id: result.rows[0].id, code: result.rows[0].code }
    } finally {
      client.release()
    }
  },

  // Get original URL by code
  getUrlByCode: async (code) => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        'SELECT * FROM urls WHERE code = $1',
        [code]
      )
      return result.rows[0] || null
    } finally {
      client.release()
    }
  },

  // Track click
  trackClick: async (urlId, ipAddress, userAgent) => {
    const client = await pool.connect()
    try {
      await client.query(
        'INSERT INTO clicks (url_id, ip_address, user_agent) VALUES ($1, $2, $3)',
        [urlId, ipAddress, userAgent]
      )
      return true
    } finally {
      client.release()
    }
  },

  // Get analytics for a URL
  getAnalytics: async (code) => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT 
          u.id,
          u.code,
          u.original_url,
          u.created_at,
          COUNT(c.id) as click_count
        FROM urls u
        LEFT JOIN clicks c ON u.id = c.url_id
        WHERE u.code = $1
        GROUP BY u.id`,
        [code]
      )
      return result.rows[0] || null
    } finally {
      client.release()
    }
  },

  // Get overall stats
  getOverallStats: async () => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT 
          COUNT(DISTINCT u.id) as total_urls,
          COUNT(c.id) as total_clicks
        FROM urls u
        LEFT JOIN clicks c ON u.id = c.url_id`
      )
      return result.rows[0] || { total_urls: 0, total_clicks: 0 }
    } finally {
      client.release()
    }
  },

  // Get recent clicks
  getRecentClicks: async (limit = 10) => {
    const client = await pool.connect()
    try {
      const result = await client.query(
        `SELECT 
          u.code,
          u.original_url,
          c.clicked_at,
          c.ip_address,
          c.user_agent
        FROM clicks c
        JOIN urls u ON c.url_id = u.id
        ORDER BY c.clicked_at DESC
        LIMIT $1`,
        [limit]
      )
      return result.rows
    } finally {
      client.release()
    }
  }
}

// Initialize tables
createTables()

export default pool
