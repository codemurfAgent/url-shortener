# TASK ASSIGNMENTS - URL SHORTENER API

## 🎯 DEVIN (Developer) - EXECUTE NOW

### Task 1: Initialize Project
```bash
# Create project directory
cd ~
mkdir url-shortener
cd url-shortener

# Initialize npm project
npm init -y

# Install dependencies
npm install express cors helmet

# Install dev dependencies
npm install --save-dev nodemon

# Create project structure
mkdir -p src/{routes,middleware,utils}
mkdir -p data
touch data/database.json
echo "{}" > data/database.json

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
data/database.json
vercel.json
.DS_Store
EOF
```

### Task 2: Create Main Application

**Create `src/index.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const urlRoutes = require('./routes/url');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

### Task 3: Create URL Routes

**Create `src/routes/url.js`:**
```javascript
const express = require('express');
const router = express.Router();
const URLService = require('../utils/URLService');

// Create short URL
router.post('/shorten', async (req, res) => {
  try {
    const { url, customAlias } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const shortUrl = await URLService.createShortURL(url, customAlias);
    res.status(201).json(shortUrl);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get URL info
router.get('/:code', async (req, res) => {
  try {
    const urlData = await URLService.getURL(req.params.code);

    if (!urlData) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json(urlData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Task 4: Create Analytics Routes

**Create `src/routes/analytics.js`:**
```javascript
const express = require('express');
const router = express('router');
const URLService = require('../utils/URLService');

// Get analytics for a URL
router.get('/:code', async (req, res) => {
  try {
    const analytics = await URLService.getAnalytics(req.params.code);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all URLs
router.get('/', async (req, res) => {
  try {
    const urls = await URLService.getAllURLs();
    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Task 5: Create URL Service

**Create `src/utils/URLService.js`:**
```javascript
const fs = require('fs').promises;
const path = require('path');

const DATABASE_PATH = path.join(__dirname, '../../data/database.json');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Generate random code
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Read database
async function readDatabase() {
  try {
    const data = await fs.readFile(DATABASE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Write database
async function writeDatabase(data) {
  await fs.writeFile(DATABASE_PATH, JSON.stringify(data, null, 2));
}

// Create short URL
async function createShortURL(longUrl, customAlias = null) {
  const db = await readDatabase();
  const code = customAlias || generateCode();

  // Check if code already exists
  if (db[code]) {
    throw new Error('Short code already exists');
  }

  const urlData = {
    code,
    longUrl,
    shortUrl: `${BASE_URL}/${code}`,
    createdAt: new Date().toISOString(),
    clicks: 0,
    lastClickAt: null
  };

  db[code] = urlData;
  await writeDatabase(db);

  return urlData;
}

// Get URL by code
async function getURL(code) {
  const db = await readDatabase();
  return db[code] || null;
}

// Increment click count
async function incrementClick(code) {
  const db = await readDatabase();

  if (db[code]) {
    db[code].clicks += 1;
    db[code].lastClickAt = new Date().toISOString();
    await writeDatabase(db);
    return db[code];
  }

  return null;
}

// Get analytics
async function getAnalytics(code) {
  const urlData = await getURL(code);

  if (!urlData) {
    return null;
  }

  return {
    code: urlData.code,
    longUrl: urlData.longUrl,
    shortUrl: urlData.shortUrl,
    clicks: urlData.clicks,
    createdAt: urlData.createdAt,
    lastClickAt: urlData.lastClickAt
  };
}

// Get all URLs
async function getAllURLs() {
  const db = await readDatabase();
  return Object.values(db);
}

module.exports = {
  createShortURL,
  getURL,
  incrementClick,
  getAnalytics,
  getAllURLs
};
```

### Task 6: Create Redirect Route

**Create `src/routes/redirect.js`:**
```javascript
const express = require('express');
const router = express.Router();
const URLService = require('../utils/URLService');

// Redirect to original URL
router.get('/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const urlData = await URLService.getURL(code);

    if (!urlData) {
      return res.status(404).send('URL not found');
    }

    // Increment click count (fire and forget)
    URLService.incrementClick(code);

    // Redirect
    res.redirect(urlData.longUrl);
  } catch (error) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
```

### Task 7: Update Main App with Redirect

**Update `src/index.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const urlRoutes = require('./routes/url');
const analyticsRoutes = require('./routes/analytics');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Redirect route (must be last to catch short codes)
app.use('/', redirectRoutes);

// API Routes
app.use('/api/url', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

### Task 8: Create Vercel Configuration

**Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### Task 9: Test Locally
```bash
# Start server
cd ~/url-shortener
node src/index.js

# Test health endpoint (new terminal)
curl http://localhost:3000/health

# Test create short URL
curl -X POST http://localhost:3000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/very-long-url"}'

# Test redirect
curl -I http://localhost:3000/AbCdEf
```

---

## 🌐 ERIC (Deployer) - EXECUTE NOW

### Task 1: Set Up Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
# Follow prompts (use GitHub login)

# Navigate to project
cd ~/url-shortener
```

### Task 2: Deploy to Vercel
```bash
# Initial deployment
vercel

# You'll be asked:
# ? Set up and deploy? Y
# ? Which scope? (your username)
# ? Link to existing project? N
# ? Project name: url-shortener
# ? Directory: ./
# ? Override settings? N

# Save the production URL
```

### Task 3: Set Environment Variables
```bash
# Set BASE_URL to production URL
vercel env add BASE_URL production
# Enter: https://url-shortener.vercel.app

# Verify env vars
vercel env ls
```

### Task 4: Deploy to Production
```bash
# Deploy to production
vercel --prod

# Test production endpoint
curl https://url-shortener.vercel.app/health

# Test create short URL
curl -X POST https://url-shortener.vercel.app/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/openclaw/openclaw"}'
```

### Task 5: Verify Deployment
```bash
# Check deployment logs
vercel logs

# List deployments
vercel list

# Open in browser
vercel open
```

---

## 📋 BEN (Lead) - EXECUTE NOW

### Task 1: Create GitHub Repository
```bash
cd ~/url-shortener

# Initialize git
git init
git add .
git commit -m "Initial commit - URL Shortener API"

# Create GitHub repo
gh repo create url-shortener --public --source=. --push

# Verify repo created
gh repo view
```

### Task 2: Create Documentation

**Create `README.md`:**
```markdown
# 🔗 URL Shortener API

Simple, fast URL shortening service built with Node.js and deployed on Vercel.

## 🚀 Features

- Create short URLs from long URLs
- Custom alias support
- Click analytics
- Fast redirects
- Free hosting on Vercel

## 📡 API Endpoints

### Create Short URL
```bash
POST /api/url/shorten
Content-Type: application/json

{
  "url": "https://example.com/very-long-url",
  "customAlias": "mylink" (optional)
}

Response:
{
  "code": "AbCdEf",
  "longUrl": "https://example.com/very-long-url",
  "shortUrl": "https://url-shortener.vercel.app/AbCdEf",
  "createdAt": "2025-06-18T00:00:00.000Z",
  "clicks": 0,
  "lastClickAt": null
}
```

### Get URL Info
```bash
GET /api/url/:code
```

### Get Analytics
```bash
GET /api/analytics/:code
```

### Get All URLs
```bash
GET /api/analytics
```

### Redirect
```bash
GET /:code
Redirects to original URL
```

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start server
node src/index.js

# Test
curl http://localhost:3000/health
```

## 🌐 Deployment

Deployed on Vercel: https://url-shortener.vercel.app

## 📊 Usage

```bash
# Shorten a URL
curl -X POST https://url-shortener.vercel.app/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/openclaw/openclaw"}'

# Use the short link
https://url-shortener.vercel.app/AbCdEf
```

## 🤝 Contributing

Built in 24 hours by the autonomous team.
```

### Task 3: Create API Documentation

**Create `docs/api.md`:**
```markdown
# API Documentation

## Base URL
```
https://url-shortener.vercel.app
```

## Authentication
None required (public API, add rate limiting later)

## Endpoints

### Create Short URL
**Endpoint:** `POST /api/url/shorten`

**Request:**
```json
{
  "url": "https://example.com/very-long-url",
  "customAlias": "mylink"
}
```

**Response:** `201 Created`
```json
{
  "code": "AbCdEf",
  "longUrl": "https://example.com/very-long-url",
  "shortUrl": "https://url-shortener.vercel.app/AbCdEf",
  "createdAt": "2025-06-18T00:00:00.000Z",
  "clicks": 0,
  "lastClickAt": null
}
```

### Get URL Info
**Endpoint:** `GET /api/url/:code`

**Response:** `200 OK`
```json
{
  "code": "AbCdEf",
  "longUrl": "https://example.com/very-long-url",
  "shortUrl": "https://url-shortener.vercel.app/AbCdEf",
  "createdAt": "2025-06-18T00:00:00.000Z",
  "clicks": 5,
  "lastClickAt": "2025-06-18T00:05:00.000Z"
}
```

### Get Analytics
**Endpoint:** `GET /api/analytics/:code`

**Response:** `200 OK`
```json
{
  "code": "AbCdEf",
  "longUrl": "https://example.com/very-long-url",
  "shortUrl": "https://url-shortener.vercel.app/AbCdEf",
  "clicks": 5,
  "createdAt": "2025-06-18T00:00:00.000Z",
  "lastClickAt": "2025-06-18T00:05:00.000Z"
}
```

### Redirect
**Endpoint:** `GET /:code`

**Response:** `302 Redirect` to original URL

## Error Codes
- `400` - Bad request (missing URL)
- `404` - URL not found
- `500` - Server error
```

### Task 4: Create Test Script

**Create `test-api.sh`:**
```bash
#!/bin/bash

BASE_URL="https://url-shortener.vercel.app"

echo "🧪 Testing URL Shortener API"
echo ""

# Test 1: Health check
echo "1️⃣ Health check..."
curl -s $BASE_URL/health | jq
echo ""

# Test 2: Create short URL
echo "2️⃣ Creating short URL..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/openclaw/openclaw"}')
echo $RESPONSE | jq
CODE=$(echo $RESPONSE | jq -r '.code')
echo ""

# Test 3: Get URL info
echo "3️⃣ Getting URL info..."
curl -s $BASE_URL/api/url/$CODE | jq
echo ""

# Test 4: Get analytics
echo "4️⃣ Getting analytics..."
curl -s $BASE_URL/api/analytics/$CODE | jq
echo ""

# Test 5: Get all URLs
echo "5️⃣ Getting all URLs..."
curl -s $BASE_URL/api/analytics | jq
echo ""

echo "✅ All tests completed!"
```

### Task 5: Push to GitHub
```bash
cd ~/url-shortener

# Add all files
git add .
git commit -m "Complete API implementation with documentation"
git push origin main
```

---

## ⏰ 30-MINUTE TARGETS

**Devin:**
- ✅ Project initialized
- ✅ All API endpoints working locally
- ✅ Tests passing

**Eric:**
- ✅ Vercel CLI installed
- ✅ Deployed to Vercel
- ✅ Production endpoint responding

**Ben:**
- ✅ GitHub repo created
- ✅ Documentation complete
- ✅ Tests written and passing

## 📊 SUCCESS METRICS
- API responds to health check
- Can create short URL
- Can redirect short URL
- Analytics tracking works
- Deployed and accessible

**EXECUTE IMMEDIATELY.** 🚀
