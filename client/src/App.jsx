import { useState, useEffect } from 'react'
import { Moon, Sun, Link, BarChart3, Copy, ExternalLink } from 'lucide-react'
import UrlForm from './components/UrlForm.jsx'
import UrlStats from './components/UrlStats.jsx'
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [currentView, setCurrentView] = useState('shorten')
  const [recentUrls, setRecentUrls] = useState([])
  const [stats, setStats] = useState({ totalUrls: 0, totalClicks: 0 })

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setDarkMode(isDark)
    
    // Fetch initial stats
    fetchStats()
  }, [])

  useEffect(() => {
    // Apply theme
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Save preference
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleUrlCreated = (newUrl) => {
    setRecentUrls(prev => [newUrl, ...prev.slice(0, 4)]) // Keep last 5
    fetchStats() // Refresh stats
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link className="w-8 h-8 text-primary-600 dark:text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">URL Shortener</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => setCurrentView('shorten')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'shorten' 
                    ? 'text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500'
                }`}
              >
                Shorten
              </button>
              <button
                onClick={() => setCurrentView('stats')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'stats' 
                    ? 'text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-500'
                }`}
              >
                Analytics
              </button>
            </nav>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentView === 'shorten' ? (
          <div className="space-y-8">
            <UrlForm onUrlCreated={handleUrlCreated} />
            
            {recentUrls.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent URLs</h2>
                <div className="space-y-3">
                  {recentUrls.map((url, index) => (
                    <div key={url.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
                            {url.shortUrl}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {url.originalUrl}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(url.shortUrl)}
                          className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500 transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500 transition-colors"
                          title="Visit URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <AnalyticsDashboard stats={stats} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Total URLs: {stats.totalUrls}</span>
              <span>Total Clicks: {stats.totalClicks}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Fast URL Shortener with Analytics
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App