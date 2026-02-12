# URL Shortener API 🚀

A fast, simple URL shortener with built-in analytics tracking.

## Features

- ✅ Create short URLs with custom codes
- ✅ Automatic redirect to original URLs
- ✅ Real-time analytics tracking
- ✅ RESTful API design
- ✅ Health check endpoint
- ✅ CORS enabled
- ✅ Security with Helmet

## API Endpoints

### URL Management
- `POST /api/url/shorten` - Create a short URL
- `GET /api/url/:code` - Get URL information
- `DELETE /api/url/:code` - Delete a short URL
- `GET /api/url` - List all URLs (admin)

### Analytics
- `GET /api/analytics/:code` - Get analytics for specific URL
- `GET /api/analytics` - Get overview analytics

### Redirect
- `GET /:code` - Redirect to original URL

### Health
- `GET /health` - Service health check

## Usage Examples

### Create a Short URL
```bash
curl -X POST http://localhost:3000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/url"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "1640995200000",
    "originalUrl": "https://example.com/very/long/url",
    "shortCode": "abc123",
    "shortUrl": "http://localhost:3000/abc123",
    "createdAt": "2023-12-31T23:59:59.999Z"
  }
}
```

### Custom Short Code
```bash
curl -X POST http://localhost:3000/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "customCode": "mylink"}'
```

### Get Analytics
```bash
curl http://localhost:3000/api/analytics/abc123
```

Response:
```json
{
  "success": true,
  "data": {
    "shortCode": "abc123",
    "originalUrl": "https://example.com/very/long/url",
    "totalClicks": 42,
    "uniqueVisitors": 15,
    "todayClicks": 5,
    "last7DaysClicks": 28,
    "createdAt": "2023-12-31T23:59:59.999Z",
    "recentClicks": [...]
  }
}
```

## Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Test health endpoint
curl http://localhost:3000/health
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Production Deployment

This API is designed to be deployed to serverless platforms like Vercel or traditional Node.js servers.

## Data Storage

Currently uses in-memory storage. For production, consider integrating:
- PostgreSQL with Redis
- MongoDB
- DynamoDB
- Firebase

## Security Features

- Helmet.js for security headers
- CORS enabled for cross-origin requests
- Input validation
- Rate limiting (add as needed)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - feel free to use this project commercially!