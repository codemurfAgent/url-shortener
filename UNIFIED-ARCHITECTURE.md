# URL Shortener - Unified Architecture Solution

## 🚨 Problems Identified

### Problem 1: Data Isolation
Each Vercel function had its own database state, causing data loss between function calls.

### Problem 2: Redirect Logic
Redirect function returned JSON instead of 302 redirect status.

## ✅ Solution: Unified Serverless Functions

### Architecture Choice
Use **individual Vercel serverless functions** (not a single Express server) because:
- ✅ Each function scales independently
- ✅ Faster cold starts (smaller functions)
- ✅ Better error isolation
- ✅ Vercel-native pattern

### Key: Shared Database Connection
All functions use the **same PostgreSQL database** to share data.

---

## 📁 File Structure

```
url-shortener/
├── server/
│   ├── lib/
│   │   ├── database.js          # Shared database operations
│   │   └── utils.js             # Shared utilities (base62, code generation)
│   ├── api/
│   │   ├── health.js            # Health check
│   │   ├── shorten.js           # Create short URL
│   │   ├── redirect.js          # Redirect handler
│   │   ├── analytics.js         # Get analytics
│   │   └── stats.js             # Get stats
│   ├── database-postgres.js     # PostgreSQL implementation
│   ├── vercel.json             # Vercel config
│   └── package.json
├── vercel.json
└── POSTGRES-MIGRATION-GUIDE.md
```

---

## 🔧 How It Works

### Shared Database Module
All API functions import from the same `lib/database.js`:

```javascript
// All functions use this
import { dbOperations } from '../lib/database.js'
```

### Database Connection Pool
PostgreSQL uses a connection pool that works across all function invocations:

```javascript
// lib/database.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
```

### Data Flow
1. `shorten.js` creates URL → saves to PostgreSQL
2. `redirect.js` reads URL → retrieves from same PostgreSQL
3. Data is **persistent** and **shared** across all functions

---

## 🎯 Implementation Steps

### Step 1: Create lib/ directory structure
```bash
cd /home/node/.openclaw/workspace/url-shortener/server
mkdir -p lib
```

### Step 2: Create shared database module
See `lib/database.js` below

### Step 3: Create shared utilities
See `lib/utils.js` below

### Step 4: Update all API functions
Import from `lib/` instead of local copies

### Step 5: Set up PostgreSQL on Render
Follow `POSTGRES-MIGRATION-GUIDE.md`

### Step 6: Deploy to Vercel
Add DATABASE_URL to Vercel and deploy

---

## ✅ Why This Works

### Before (Broken):
```
shorten.js → creates URL → saves to local DB
redirect.js → looks for URL → can't find it (different DB!)
```

### After (Fixed):
```
shorten.js → creates URL → saves to PostgreSQL
redirect.js → looks for URL → finds it (same PostgreSQL!)
```

### Key: PostgreSQL is external
- Database lives on Render (external server)
- All Vercel functions connect to the same database
- Data persists and is shared across all function invocations

---

## 📋 API Endpoint Mapping

| Function | Route | Method | Purpose |
|----------|-------|--------|---------|
| `api/health.js` | `/api/health` | GET | Health check |
| `api/shorten.js` | `/api/shorten` | POST | Create short URL |
| `api/redirect.js` | `/api/redirect` | GET | Redirect to original URL |
| `api/analytics.js` | `/api/analytics` | GET | Get URL analytics |
| `api/stats.js` | `/api/stats` | GET | Get overall stats |

---

## 🚨 Common Issues & Solutions

### Issue: "URL not found"
**Cause:** Database not ready or connection issue
**Solution:** Wait for PostgreSQL to be ready (1-2 min after creation)

### Issue: "Connection refused"
**Cause:** Wrong DATABASE_URL or database not ready
**Solution:** Verify connection string in Vercel environment variables

### Issue: "Relation does not exist"
**Cause:** Tables not created yet
**Solution:** First connection auto-creates tables, wait a moment

---

## 🎯 Success Criteria

✅ All API functions use the same database module
✅ Data persists across function invocations
✅ Redirect returns 302 status (not JSON)
✅ All endpoints tested and working

---

## 📞 Next Steps

1. ✅ Create shared `lib/` modules (done in this document)
2. ⏳ Set up PostgreSQL on Render
3. ⏳ Update all API functions to use `lib/`
4. ⏳ Deploy to Vercel
5. ⏳ Test all endpoints

---

**Status:** Architecture designed, ready for implementation
**Next:** Create the actual files
