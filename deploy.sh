#!/bin/bash

# URL Shortener Deployment Script
# Author: Eric - Deployment Specialist

echo "🚀 URL SHORTENER DEPLOYMENT STARTED"
echo "===================================="

# Navigate to project directory
cd "$(dirname "$0")"

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Initialize Git repository
echo "🔧 Initializing Git repository..."
git init
git add .
git commit -m "Initial commit - URL Shortener API"

# 3. Create GitHub repository
echo "🌐 Creating GitHub repository..."
gh repo create url-shortener --public --source=. --push

# 4. Deploy to Vercel
echo "⚡ Deploying to Vercel..."
vercel --prod

# 5. Deploy to Render (if render.yaml exists)
if [ -f "render.yaml" ]; then
    echo "🎯 Deploying to Render..."
    render deploy
fi

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📋 DEPLOYMENT SUMMARY:"
echo "- GitHub Repository: https://github.com/your-username/url-shortener"
echo "- Vercel URL: Check Vercel dashboard for live URL"
echo "- Render URL: Check Render dashboard for live URL (if deployed)"
echo ""
echo "🧪 NEXT STEPS:"
echo "1. Test the live API endpoints"
echo "2. Verify analytics tracking"
echo "3. Check redirect functionality"
echo "4. Monitor performance metrics"