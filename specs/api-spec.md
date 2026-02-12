# URL Shortener API - Specification

## Overview
Simple REST API for shortening URLs with basic analytics tracking.

## Base URL
- **Local:** `http://localhost:3000`
- **Production:** `https://url-shortener.vercel.app`

## API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-06-18T00:00:00.000Z"
}
```

### 2. Create Short URL
```http
POST /api/url/shorten
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://example.com/very-long-url",
  "customAlias": "mylink"
}
```

**Fields:**
- `url` (required, string): The long URL to shorten
- `customAlias` (optional, string): Custom short code (6 chars max)

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

**Error Response:** `400 Bad Request`
```json
{
  "error": "URL is required"
}
```

### 3. Get URL Info
```http
GET /api/url/:code
```

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

**Error Response:** `404 Not Found`
```json
{
  "error": "URL not found"
}
```

### 4. Get Analytics
```http
GET /api/analytics/:code
```

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

### 5. Get All URLs
```http
GET /api/analytics
```

**Response:** `200 OK`
```json
[
  {
    "code": "AbCdEf",
    "longUrl": "https://example.com/very-long-url",
    "shortUrl": "https://url-shortener.vercel.app/AbCdEf",
    "clicks": 5,
    "createdAt": "2025-06-18T00:00:00.000Z",
    "lastClickAt": "2025-06-18T00:05:00.000Z"
  }
]
```

### 6. Redirect
```http
GET /:code
```

**Response:** `302 Found`
- Redirects to the original URL
- Increments click counter

## Data Model

### URL Object
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

**Fields:**
- `code`: Unique short code (6 characters, alphanumeric)
- `longUrl`: Original URL
- `shortUrl`: Full short URL
- `createdAt`: Creation timestamp (ISO 8601)
- `clicks`: Number of times the URL was clicked
- `lastClickAt`: Timestamp of last click (ISO 8601)

## Constraints

- Short codes are 6 characters by default
- Custom aliases cannot exceed 20 characters
- URL validation: Must be a valid HTTP/HTTPS URL
- Rate limiting: Not implemented yet (future enhancement)

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 201  | Created |
| 302  | Redirect |
| 400  | Bad request |
| 404  | Not found |
| 500  | Server error |

## Future Enhancements

- [ ] Rate limiting per IP
- [ ] QR code generation
- [ ] Link expiration dates
- [ ] Password protection
- [ ] Custom domains
- [ ] Database migration (JSON → PostgreSQL)
- [ ] User authentication
- [ ] Analytics dashboard
