import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'
import { dbOperations } from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Base62 encoding
const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function toBase62(num) {
  if (num === 0) return '0'
  let result = ''
  while (num > 0) {
    result = base62Chars[num % 62] + result
    num = Math.floor(num / 62)
  }
  return result
}

function fromBase62(str) {
  let result = 0
  for (let i = 0; i < str.length; i++) {
    result = result * 62 + base62Chars.indexOf(str[i])
  }
  return result
}

// Generate unique short code
function generateCode() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 62)
  return toBase62(timestamp + random).slice(-6) // 6-character code
}

// Routes

// POST /api/shorten - Create short URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Generate unique code
    let code
    let attempts = 0
    do {
      code = generateCode()
      attempts++
    } while (await dbOperations.getUrlByCode(code) && attempts < 10)

    if (attempts >= 10) {
      return res.status(500).json({ error: 'Failed to generate unique code' })
    }

    // Store in database
    const result = await dbOperations.createShortUrl(url, code)
    const shortUrl = `${BASE_URL}/${code}`

    res.json({
      id: result.id,
      code: result.code,
      shortUrl,
      originalUrl: url,
      createdAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error creating short URL:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /:code - Redirect to original URL and track click
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const urlData = await dbOperations.getUrlByCode(code)

    if (!urlData) {
      return res.status(404).json({ error: 'Short URL not found' })
    }

    // Track click
    const ipAddress = req.ip || req.headers['x-forwarded-for']
    const userAgent = req.headers['user-agent']
    await dbOperations.trackClick(urlData.id, ipAddress, userAgent)

    // Redirect to original URL
    res.redirect(urlData.original_url)

  } catch (error) {
    console.error('Error redirecting:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/analytics/:code - Get click stats for URL
app.get('/api/analytics/:code', async (req, res) => {
  try {
    const { code } = req.params
    const analytics = await dbOperations.getAnalytics(code)

    if (!analytics) {
      return res.status(404).json({ error: 'URL not found' })
    }

    res.json({
      id: analytics.id,
      code: analytics.code,
      originalUrl: analytics.original_url,
      createdAt: analytics.created_at,
      clickCount: analytics.click_count || 0
    })

  } catch (error) {
    console.error('Error getting analytics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/stats - Get overall stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await dbOperations.getOverallStats()
    const recentClicks = await dbOperations.getRecentClicks(10)

    res.json({
      totalUrls: stats.total_urls || 0,
      totalClicks: stats.total_clicks || 0,
      recentClicks
    })

  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT
  })
})

// Serve static files (for production)
app.use(express.static(join(__dirname, '../client/dist')))

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 URL Shortener server running on port ${PORT}`)
  console.log(`🌐 Base URL: ${BASE_URL}`)
})