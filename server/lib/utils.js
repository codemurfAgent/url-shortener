// Shared utility functions for URL Shortener

// Base62 characters for URL encoding
const base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Convert number to Base62 string
 * @param {number} num - Number to convert
 * @returns {string} Base62 string
 */
export function toBase62(num) {
  if (num === 0) return '0'
  let result = ''
  while (num > 0) {
    result = base62Chars[num % 62] + result
    num = Math.floor(num / 62)
  }
  return result
}

/**
 * Convert Base62 string to number
 * @param {string} str - Base62 string
 * @returns {number} Number
 */
export function fromBase62(str) {
  let result = 0
  for (let i = 0; i < str.length; i++) {
    result = result * 62 + base62Chars.indexOf(str[i])
  }
  return result
}

/**
 * Generate unique short code
 * Uses timestamp + random for uniqueness
 * @returns {string} 6-character Base62 code
 */
export function generateCode() {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 62)
  return toBase62(timestamp + random).slice(-6)
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Get base URL from environment or fallback
 * @returns {string} Base URL
 */
export function getBaseUrl() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BASE_URL || 'http://localhost:3001'
}

/**
 * Extract IP address from request headers
 * @param {Object} headers - Request headers
 * @param {string} ip - Request IP
 * @returns {string} IP address
 */
export function getIpAddress(headers, ip) {
  return headers['x-forwarded-for'] ||
         headers['x-real-ip'] ||
         ip ||
         'unknown'
}

/**
 * Extract user agent from request headers
 * @param {Object} headers - Request headers
 * @returns {string} User agent
 */
export function getUserAgent(headers) {
  return headers['user-agent'] || 'unknown'
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - 3) + '...'
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitize(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Parse user agent string
 * @param {string} userAgent - User agent string
 * @returns {Object} Parsed user agent info
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: 'unknown', os: 'unknown' }

  // Simple parsing (for production, use a library like 'ua-parser-js')
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)\/?\s*(\d+)/i)
  const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)\/?\s*(\d+(\.\d+)*)?/i)

  return {
    browser: browserMatch ? browserMatch[1] : 'unknown',
    browserVersion: browserMatch ? browserMatch[2] : 'unknown',
    os: osMatch ? osMatch[1] : 'unknown',
    osVersion: osMatch ? osMatch[2] : 'unknown',
    raw: userAgent
  }
}

/**
 * Calculate click rate (clicks per day since creation)
 * @param {Date} createdAt - URL creation date
 * @param {number} totalClicks - Total click count
 * @returns {number} Clicks per day
 */
export function calculateClickRate(createdAt, totalClicks) {
  if (!createdAt || totalClicks === 0) return 0

  const now = new Date()
  const days = Math.max(1, Math.ceil((now - new Date(createdAt)) / (1000 * 60 * 60 * 24)))
  return (totalClicks / days).toFixed(2)
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} Percentage
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0
  return ((value / total) * 100).toFixed(2)
}

/**
 * Get time ago string
 * @param {Date} date - Date to format
 * @returns {string} Time ago string
 */
export function getTimeAgo(date) {
  if (!date) return 'never'

  const seconds = Math.floor((new Date() - new Date(date)) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
  return `${Math.floor(seconds / 31536000)} years ago`
}

/**
 * Validate API key (placeholder for future auth)
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid
 */
export function validateApiKey(apiKey) {
  // TODO: Implement proper API key validation
  // For now, accept any non-empty string
  return apiKey && apiKey.length > 0
}

/**
 * Rate limiter check (in-memory for now)
 * @param {Map} rateLimitMap - Rate limit map
 * @param {string} key - Rate limit key (e.g., IP address)
 * @param {number} limit - Request limit
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit status
 */
export function checkRateLimit(rateLimitMap, key, limit, windowMs) {
  const now = Date.now()
  const windowStart = now - windowMs

  // Clean old entries
  for (const [k, v] of rateLimitMap.entries()) {
    if (v.timestamp < windowStart) {
      rateLimitMap.delete(k)
    }
  }

  const record = rateLimitMap.get(key) || { count: 0, timestamp: now }

  if (record.timestamp < windowStart) {
    record.count = 1
    record.timestamp = now
  } else {
    record.count++
  }

  rateLimitMap.set(key, record)

  return {
    allowed: record.count <= limit,
    count: record.count,
    limit,
    reset: record.timestamp + windowMs
  }
}

export default {
  toBase62,
  fromBase62,
  generateCode,
  isValidUrl,
  getBaseUrl,
  getIpAddress,
  getUserAgent,
  truncate,
  sanitize,
  parseUserAgent,
  calculateClickRate,
  formatNumber,
  calculatePercentage,
  getTimeAgo,
  validateApiKey,
  checkRateLimit
}
