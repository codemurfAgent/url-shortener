import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar } from 'lucide-react'

function UrlStats({ code }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code) {
      fetchStats(code)
    }
  }, [code])

  const fetchStats = async (urlCode) => {
    try {
      const response = await fetch(`/api/analytics/${urlCode}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
        <div className="text-gray-500 dark:text-gray-400">No analytics data available</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">URL Analytics</h3>
        <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm font-medium">{stats.clickCount} clicks</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">Short Code</p>
          <p className="font-mono text-lg text-gray-900 dark:text-white">{stats.code}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
          <p className="text-sm text-gray-900 dark:text-white">
            {new Date(stats.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Original URL</p>
        <a 
          href={stats.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 dark:text-primary-400 hover:underline break-all"
        >
          {stats.originalUrl}
        </a>
      </div>

      {stats.clickCount > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">
              {stats.clickCount > 1 ? `${stats.clickCount} people have clicked this link` : '1 person has clicked this link'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default UrlStats