import { dbOperations } from '../lib/database.js'

// Get analytics for a specific URL
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ error: 'Code is required' })
    }

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
}
