# Vercel Configuration Fix - API Directory Structure

## 🚨 Issue Fixed

Vercel expects API functions in an `api/` directory. The project has been restructured to match Vercel's requirements.

---

## ✅ What Was Done

### 1. Created Vercel-Specific API Functions

**New Files Created:**
```
server/api/
├── health.js      - Health check endpoint
├── shorten.js     - Create short URL (POST /api/shorten)
├── redirect.js    - Redirect handler (GET /:code)
├── analytics.js   - Get analytics (GET /api/analytics/:code)
└── stats.js       - Get overall stats (GET /api/stats)
```

### 2. Updated Vercel Configuration

**Two vercel.json files created:**

**Root (`url-shortener/vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server/server.js"
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/server/server.js"
    },
    {
      "source": "/:path*",
      "destination": "/server/server.js"
    }
  ]
}
```

**Server (`server/vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

---

## 📋 Current Project Structure

```
url-shortener/
├── package.json                    # Root package.json
├── vercel.json                    # ✅ NEW - Vercel config
├── README.md
├── server/
│   ├── package.json               # Server package.json
│   ├── server.js                 # Express server (main)
│   ├── database.js               # SQLite operations
│   ├── vercel.json               # ✅ NEW - Server Vercel config
│   ├── data/                     # SQLite database (create if missing)
│   │   └── urls.db
│   └── api/                      # ✅ NEW - Vercel API functions
│       ├── health.js             # GET /health
│       ├── shorten.js            # POST /api/shorten
│       ├── redirect.js           # GET /:code
│       ├── analytics.js          # GET /api/analytics/:code
│       └── stats.js              # GET /api/stats
```

---

## 🚀 Deployment Steps

### Option 1: Deploy Using Vercel API Functions (Recommended)

This approach uses individual serverless functions for each endpoint.

**Step 1: Create database directory**
```bash
cd /home/node/.openclaw/workspace/url-shortener/server
mkdir -p data
```

**Step 2: Deploy to Vercel**
```bash
cd /home/node/.openclaw/workspace/url-shortener
vercel login
vercel --prod
```

**Step 3: Test the deployed API**
```bash
# Health check
curl https://your-url.vercel.app/api/health

# Create short URL
curl -X POST https://your-url.vercel.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test redirect (replace code with actual code)
curl -I https://your-url.vercel.app/api/redirect?code=AbCdEf
```

### Option 2: Deploy Using Express Server (Alternative)

This approach uses the Express server for all routes.

**Step 1: Create database directory**
```bash
cd /home/node/.openclaw/workspace/url-shortener/server
mkdir -p data
```

**Step 2: Deploy to Vercel**
```bash
cd /home/node/.openclaw/workspace/url-shortener/server
vercel login
vercel --prod
```

**Step 3: Test the deployed API**
```bash
# Health check
curl https://your-url.vercel.app/health

# Create short URL
curl -X POST https://your-url.vercel.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test redirect (replace code with actual code)
curl -I https://your-url.vercel.app/AbCdEf
```

---

## 🧪 Testing API Endpoints

### 1. Health Check
```bash
curl https://your-url.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T...",
  "service": "URL Shortener API"
}
```

### 2. Create Short URL
```bash
curl -X POST https://your-url.vercel.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Expected Response:**
```json
{
  "id": 1,
  "code": "AbCdEf",
  "shortUrl": "https://your-url.vercel.app/AbCdEf",
  "originalUrl": "https://example.com",
  "createdAt": "2025-01-18T..."
}
```

### 3. Get Analytics
```bash
curl https://your-url.vercel.app/api/analytics?code=AbCdEf
```

**Expected Response:**
```json
{
  "id": 1,
  "code": "AbCdEf",
  "originalUrl": "https://example.com",
  "createdAt": "2025-01-18T...",
  "clickCount": 0
}
```

### 4. Get Overall Stats
```bash
curl https://your-url.vercel.app/api/stats
```

**Expected Response:**
```json
{
  "totalUrls": 1,
  "totalClicks": 0,
  "recentClicks": []
}
```

### 5. Test Redirect
```bash
curl -I https://your-url.vercel.app/api/redirect?code=AbCdEf
```

**Expected Response:**
```
HTTP/1.1 302 Found
Location: https://example.com
```

---

## 🔧 Troubleshooting

### Issue: Database directory not found
**Solution:**
```bash
cd /home/node/.openclaw/workspace/url-shortener/server
mkdir -p data
chmod 755 data
```

### Issue: API returns 404
**Solution:** Check that `vercel.json` is in the root directory and routes are correctly configured.

### Issue: CORS errors
**Solution:** CORS is handled in the API functions. If you still see CORS errors, check the browser console for specific error messages.

### Issue: Database connection errors
**Solution:** Ensure the `data/` directory exists and is writable. SQLite will create the database file automatically.

---

## 📊 API Endpoint Mapping

| Original Endpoint | Vercel API Function | HTTP Method |
|------------------|---------------------|-------------|
| `/health` | `/api/health` | GET |
| `/api/shorten` | `/api/shorten` | POST |
| `/:code` | `/api/redirect?code=XYZ` | GET |
| `/api/analytics/:code` | `/api/analytics?code=XYZ` | GET |
| `/api/stats` | `/api/stats` | GET |

---

## 🎯 Best Practices for Vercel Deployment

1. **Use Serverless Functions:** Each API function runs independently and scales automatically
2. **Keep Functions Small:** Each function should handle a single route
3. **Environment Variables:** Use Vercel dashboard to set environment variables
4. **Database:** Use external database service (SQLite works for development, consider PostgreSQL for production)
5. **Logging:** Use `console.log` for debugging (Vercel captures logs)

---

## 🚨 Important Notes

1. **Database Persistence:** SQLite database stored in `server/data/urls.db` is ephemeral on Vercel serverless functions. Consider using external database (PostgreSQL, MongoDB) for production.

2. **Cold Starts:** Serverless functions may have cold starts (1-3 seconds delay on first request). This is normal behavior.

3. **Timeout:** Vercel serverless functions have a 10-second timeout limit. For long-running operations, consider using background workers.

4. **Storage Limits:** Each serverless function has a 50MB limit. Large files should be stored externally.

---

## 📞 Next Steps

1. **Deploy Now:** Run `vercel --prod` in the root directory
2. **Test All Endpoints:** Use the testing commands above
3. **Monitor Logs:** Check Vercel dashboard for function logs
4. **Set Up Database:** Consider migrating to PostgreSQL for production
5. **Add Monitoring:** Set up error tracking (Sentry, LogRocket)

---

**Status:** ✅ Vercel configuration fixed
**Next Action:** Deploy to Vercel and test

---

**@Eric:** Please deploy using the new Vercel configuration and report back with the live URL and test results.
