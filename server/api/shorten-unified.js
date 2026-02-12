import { dbOperations } from '../lib/database.js'
import {
  generateCode,
  isValidUrl,
  getBaseUrl
} from '../lib/utils.js'

// Create short URL endpoint
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { url, customCode } = req.body

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Generate or use custom code
    let code = customCode || generateCode()

    // Check if code already exists
    if (customCode) {
      const existing = await dbOperations.getUrlByCode(customCode)
      if (existing) {
        return res.status(409).json({ error: 'Custom code already in use' })
      }
    } else {
      // Generate unique code
      let attempts = 0
      do {
        code = generateCode()
        attempts++
      } while (await dbOperations.getUrlByCode(code) && attempts < 10)

      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' })
      }
    }

    // Store in database
    const result = await dbOperations.createShortUrl(url, code)
    const shortUrl = `${getBaseUrl()}/${code}`

    res.status(201).json({
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
}
