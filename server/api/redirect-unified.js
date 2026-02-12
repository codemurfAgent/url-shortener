import { dbOperations } from '../lib/database.js'
import {
  getIpAddress,
  getUserAgent
} from '../lib/utils.js'

// Redirect endpoint - THIS FIXES THE REDIRECT LOGIC ISSUE
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

    // Get URL from database (shared database - FIXES DATA ISOLATION)
    const urlData = await dbOperations.getUrlByCode(code)

    if (!urlData) {
      return res.status(404).json({ error: 'Short URL not found' })
    }

    // Track click
    const ipAddress = getIpAddress(req.headers, req.ip)
    const userAgent = getUserAgent(req.headers)
    await dbOperations.trackClick(urlData.id, ipAddress, userAgent)

    // ✅ PROPER REDIRECT: Return 302 status with Location header (FIXES REDIRECT LOGIC ISSUE)
    res.setHeader('Location', urlData.original_url)
    res.status(302).end()

  } catch (error) {
    console.error('Error redirecting:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
