# API Examples & Testing

## Quick Start Commands

```bash
# Start the server
npm start

# Test health endpoint
curl http://localhost:3000/health
```

## API Testing Examples

### 1. Create Short URL
```bash
curl -X POST http://localhost:3000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/openclaw/openclaw"}'
```

### 2. Create Custom Short URL
```bash
curl -X POST http://localhost:3000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://docs.openclaw.ai", "customCode": "docs"}'
```

### 3. Get URL Info
```bash
curl http://localhost:3000/api/url/[short-code]
```

### 4. Get Analytics
```bash
curl http://localhost:3000/api/analytics/[short-code]
```

### 5. Test Redirect (in browser)
```
http://localhost:3000/[short-code]
```

### 6. Get All URLs
```bash
curl http://localhost:3000/api/url
```

### 7. Get Overview Analytics
```bash
curl http://localhost:3000/api/analytics
```

### 8. Delete URL
```bash
curl -X DELETE http://localhost:3000/api/url/[short-code]
```

## Expected Responses

### Health Check
```json
{
  "status": "OK",
  "timestamp": "2023-12-31T23:59:59.999Z",
  "uptime": 123.456
}
```

### Create Short URL Success
```json
{
  "success": true,
  "data": {
    "id": "1640995200000",
    "originalUrl": "https://github.com/openclaw/openclaw",
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123",
    "createdAt": "2023-12-31T23:59:59.999Z"
  }
}
```

### Analytics Response
```json
{
  "success": true,
  "data": {
    "shortCode": "abc123",
    "originalUrl": "https://github.com/openclaw/openclaw",
    "totalClicks": 5,
    "uniqueVisitors": 3,
    "todayClicks": 2,
    "last7DaysClicks": 5,
    "createdAt": "2023-12-31T23:59:59.999Z",
    "recentClicks": [
      {
        "timestamp": "2023-12-31T23:59:59.999Z",
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "referer": "direct",
        "country": "unknown"
      }
    ]
  }
}
```

## Testing with Postman

Import this collection:

```json
{
  "info": {
    "name": "URL Shortener API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    },
    {
      "name": "Create Short URL",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/url/shorten",
        "body": {
          "mode": "raw",
          "raw": "{\"url\": \"https://example.com\"}"
        }
      }
    },
    {
      "name": "Get Analytics",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/analytics/{{shortCode}}"
      }
    }
  ]
}
```

## Performance Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create artillery config (artillery-config.yml)
# Then run: artillery run artillery-config.yml
```