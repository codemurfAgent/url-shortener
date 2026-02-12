import { useState } from 'react'
import { Link2, Copy, CheckCircle } from 'lucide-react'

function UrlForm({ onUrlCreated }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      // Basic URL validation
      new URL(url.trim())
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError('')
    setCopied(false)

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create short URL')
      }

      const data = await response.json()
      setResult(data)
      onUrlCreated(data)
      setUrl('')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Shorten Your URLs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create short, memorable links with detailed analytics
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter your long URL here..."
                  className={`w-full px-4 py-3 pr-12 border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Link2 className="w-5 h-5" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Shorten'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2 fade-in">{error}</p>
            )}
          </div>
        </form>

        {result && (
          <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg fade-in">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Your Short URL
                  </h3>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Original: 
                    <span className="ml-1 text-gray-900 dark:text-white truncate block">
                      {result.originalUrl}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Short URL: 
                    <span className="ml-1 font-mono text-primary-600 dark:text-primary-400 break-all">
                      {result.shortUrl}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={copyToClipboard}
                className={`ml-4 px-4 py-2 rounded-lg font-medium transition-all ${
                  copied 
                    ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200 copy-success'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {copied ? (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚡</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Lightning Fast</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Instant URL creation with no delays
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track clicks and monitor performance
          </p>
        </div>
        
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Links</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Reliable and secure redirection
          </p>
        </div>
      </div>
    </div>
  )
}

export default UrlForm