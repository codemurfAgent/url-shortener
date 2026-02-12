import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Link, MousePointer } from 'lucide-react'

function AnalyticsDashboard({ stats }) {
  const [analyticsData, setAnalyticsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setAnalyticsData(data.recentClicks || [])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  // Prepare data for charts
  const clicksByDay = analyticsData.reduce((acc, click) => {
    const date = new Date(click.clicked_at).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(clicksByDay).map(([date, clicks]) => ({
    date,
    clicks
  }))

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total URLs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUrls}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Link className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalClicks}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <MousePointer className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg. CTR</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUrls > 0 ? ((stats.totalClicks / stats.totalUrls) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top URL</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {analyticsData.length > 0 ? analyticsData[0].code : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Clicks Chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Clicks Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#111827' }}
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Clicks Table */}
      {analyticsData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Clicks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Short Code</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">Original URL</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.map((click, index) => (
                  <tr key={click.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">
                      {new Date(click.clicked_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-primary-600 dark:text-primary-400">
                      {click.code}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-white truncate max-w-xs">
                      {click.original_url}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {click.ip_address || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard