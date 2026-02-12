import { dbOperations } from '../lib/database.js'

// Get overall statistics
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
}
