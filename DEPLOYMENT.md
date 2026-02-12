# 🚀 URL Shortener Deployment Guide

## Quick Deployment Commands

### Option 1: Automated Deployment
```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Step-by-Step

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Git Repository Setup
```bash
git init
git add .
git commit -m "Initial commit - URL Shortener API"
gh repo create url-shortener --public --source=. --push
```

#### 3. Vercel Deployment
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### 4. Render Deployment (Optional)
```bash
# Install Render CLI (if not installed)
npm install -g @render/cli

# Deploy to Render
render deploy
```

## 🧪 Testing the Deployed API

### Health Check
```bash
curl https://your-app.vercel.app/health
```

### Create Short URL
```bash
curl -X POST https://your-app.vercel.app/api/url/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/openclaw/openclaw"}'
```

### Test Redirect
Open in browser: `https://your-app.vercel.app/[short-code]`

### Get Analytics
```bash
curl https://your-app.vercel.app/api/analytics/[short-code]
```

## 📊 Deployment URLs

After deployment, you'll have:

1. **GitHub Repository**: `https://github.com/your-username/url-shortener`
2. **Vercel API**: `https://your-app.vercel.app`
3. **Render API**: `https://your-app.onrender.com` (if deployed)

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` for deployment
- `PORT`: Vercel handles this automatically, Render uses 10000

### Vercel Specifics
- Serverless functions automatically scale
- Custom domain available in Vercel dashboard
- Analytics and metrics built-in

### Render Specifics
- Free tier available
- Auto-deploys on git push
- Custom domain supported

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check node_modules
rm -rf node_modules package-lock.json
npm install
```

#### 2. CORS Issues
The API includes CORS middleware, but verify:
- Origin headers are properly set
- Preflight requests are handled

#### 3. Memory Limits (Vercel)
- Free tier: 1GB memory
- Function timeout: 10 seconds
- Consider upgrading for high traffic

#### 4. Cold Starts
- First request may be slower
- Subsequent requests are faster
- Consider keeping warm for production

## 📈 Performance Monitoring

### Vercel Analytics
- Built-in performance metrics
- Request/response times
- Error tracking

### Render Monitoring
- Application logs
- Resource usage
- Response times

### Custom Analytics
The API includes built-in analytics tracking:
- Click counts
- Unique visitors
- Geographic data
- Referrer tracking

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🎯 Success Metrics

✅ **Deployment Checklist**
- [ ] API is accessible via HTTPS
- [ ] All endpoints respond correctly
- [ ] Redirect functionality works
- [ ] Analytics tracking is active
- [ ] Error handling is working
- [ ] CORS is properly configured
- [ ] Health check returns 200
- [ ] Custom codes work as expected

## 📞 Support

For deployment issues:
1. Check Vercel/Render dashboard logs
2. Review GitHub Actions (if enabled)
3. Test locally with `npm start`
4. Verify environment variables
5. Check API endpoint responses