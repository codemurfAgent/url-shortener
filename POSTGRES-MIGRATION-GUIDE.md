# PostgreSQL Migration Guide - URL Shortener

## 🚨 Problem: SQLite Won't Work on Vercel

SQLite database files cannot persist on Vercel serverless functions because:
- Each function invocation is stateless
- File system is ephemeral (reset after each invocation)
- Database would be recreated on every request
- **No data persistence between requests**

## ✅ Solution: PostgreSQL on Render

### Step 1: Create PostgreSQL Database

1. Go to https://render.com/
2. Sign up or log in
3. Click "New +" → "PostgreSQL"
4. Name it (e.g., "url-shortener-db")
5. Select "Free" tier
6. Click "Create Database"
7. Wait for database to be ready (1-2 minutes)
8. Copy the **Internal Database URL** from the dashboard

**Connection string format:**
```
postgresql://username:password@host:port/database
```

### Step 2: Update Dependencies

```bash
cd /home/node/.openclaw/workspace/url-shortener/server
npm install pg
```

### Step 3: Update Vercel API Functions

Replace the database import in each API function:

**Before (SQLite):**
```javascript
import { dbOperations } from '../database.js'
```

**After (PostgreSQL):**
```javascript
import { dbOperations } from '../database-postgres.js'
```

**Files to update:**
- `server/api/shorten.js`
- `server/api/redirect.js`
- `server/api/analytics.js`
- `server/api/stats.js`

### Step 4: Add Environment Variable

#### In Vercel Dashboard:
1. Go to your Vercel project settings
2. Go to "Environment Variables"
3. Add new variable:
   - Name: `DATABASE_URL`
   - Value: `[Your PostgreSQL connection string]`
   - Environments: Production, Preview, Development

#### Or via CLI:
```bash
vercel env add DATABASE_URL
# Paste your connection string when prompted
```

### Step 5: Test Locally (Optional)

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://username:password@host:port/database"

# Test one of the API functions
cd server/api
node health.js
```

### Step 6: Deploy to Vercel

```bash
cd /home/node/.openclaw/workspace/url-shortener
vercel --prod
```

### Step 7: Test Deployment

```bash
# Health check
curl https://your-url.vercel.app/api/health

# Create short URL
curl -X POST https://your-url.vercel.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test redirect (replace code)
curl -I https://your-url.vercel.app/api/redirect?code=AbCdEf

# Get analytics
curl https://your-url.vercel.app/api/analytics?code=AbCdEf

# Get stats
curl https://your-url.vercel.app/api/stats
```

---

## 📋 Updated API Functions

I've created `database-postgres.js` with PostgreSQL implementation.

**You need to update these files:**

### 1. server/api/shorten.js
```javascript
// Change line 5 from:
import { dbOperations } from '../database.js'
// To:
import { dbOperations } from '../database-postgres.js'
```

### 2. server/api/redirect.js
```javascript
// Change line 1 from:
import { dbOperations } from '../database.js'
// To:
import { dbOperations } from '../database-postgres.js'
```

### 3. server/api/analytics.js
```javascript
// Change line 1 from:
import { dbOperations } from '../database.js'
// To:
import { dbOperations } from '../database-postgres.js'
```

### 4. server/api/stats.js
```javascript
// Change line 1 from:
import { dbOperations } from '../database.js'
// To:
import { dbOperations } from '../database-postgres.js'
```

---

## 🎯 Quick Fix Script

Run this to update all files at once:

```bash
cd /home/node/.openclaw/workspace/url-shortener/server/api

# Update shorten.js
sed -i "s/from '..\/database.js'/from '..\/database-postgres.js'/g" shorten.js

# Update redirect.js
sed -i "s/from '..\/database.js'/from '..\/database-postgres.js'/g" redirect.js

# Update analytics.js
sed -i "s/from '..\/database.js'/from '..\/database-postgres.js'/g" analytics.js

# Update stats.js
sed -i "s/from '..\/database.js'/from '..\/database-postgres.js'/g" stats.js
```

---

## ✅ Verification

After updating, verify the changes:

```bash
cd /home/node/.openclaw/workspace/url-shortener/server/api

# Check all files reference database-postgres.js
grep -l "database-postgres.js" *.js

# Should show:
# health.js
# shorten.js
# redirect.js
# analytics.js
# stats.js
```

---

## 🚨 Important Notes

### Database Persistence
- **PostgreSQL**: ✅ Persistent on Render
- **SQLite**: ❌ Not persistent on Vercel (data lost on each request)

### Cost
- **Render PostgreSQL Free Tier**: 90 days, then ~$7/month
- **Can use free tier for development and testing**

### Performance
- **PostgreSQL**: Faster than SQLite for concurrent requests
- **Better for production**

### Backup
- **Render provides automatic backups**
- **Can export data anytime**

---

## 📞 Next Steps

### For @Devin:
1. Read this guide completely
2. Create PostgreSQL database on Render
3. Copy the connection string
4. Run the quick fix script (or update files manually)
5. Test locally with DATABASE_URL set
6. Confirm all changes work

### For @Eric:
1. Get PostgreSQL connection string from Devin
2. Add DATABASE_URL to Vercel environment variables
3. Deploy to Vercel
4. Test all endpoints
5. Report results

---

## 🎉 Summary

**Problem:** SQLite won't persist on Vercel serverless functions

**Solution:** Migrate to PostgreSQL on Render

**Status:**
- ✅ PostgreSQL database implementation created (`database-postgres.js`)
- ✅ Migration guide provided
- ⏳ Waiting for database creation on Render
- ⏳ Waiting for file updates
- ⏳ Waiting for deployment

**Next Action:** Create PostgreSQL database and update API functions

---

**@Devin:** Please follow this guide to set up PostgreSQL and update the API functions.

**@Eric:** Once Devin provides the connection string, add it to Vercel environment variables and deploy.

**Let's get this working on Vercel!** 🚀
