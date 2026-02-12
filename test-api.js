#!/usr/bin/env node

// Simple test script to verify API endpoints
const URLService = require('./src/utils/URLService');

console.log('🧪 Testing URL Service...\n');

// Test 1: Create a short URL
try {
  const urlEntry = URLService.createShortUrl('https://example.com/very/long/url');
  console.log('✅ Test 1 PASSED: Created short URL');
  console.log(`   Code: ${urlEntry.shortCode}`);
  console.log(`   Original: ${urlEntry.originalUrl}\n`);
  
  // Test 2: Retrieve URL by code
  const retrieved = URLService.getUrlByCode(urlEntry.shortCode);
  if (retrieved && retrieved.originalUrl === 'https://example.com/very/long/url') {
    console.log('✅ Test 2 PASSED: Retrieved URL by code\n');
  } else {
    console.log('❌ Test 2 FAILED: Could not retrieve URL\n');
  }
  
  // Test 3: Record clicks
  URLService.recordClick(urlEntry.shortCode, { ip: '127.0.0.1', userAgent: 'test' });
  URLService.recordClick(urlEntry.shortCode, { ip: '192.168.1.1', userAgent: 'test' });
  
  const updated = URLService.getUrlByCode(urlEntry.shortCode);
  if (updated.clicks === 2) {
    console.log('✅ Test 3 PASSED: Click tracking works\n');
  } else {
    console.log(`❌ Test 3 FAILED: Expected 2 clicks, got ${updated.clicks}\n`);
  }
  
  // Test 4: Get analytics
  const analytics = URLService.getAnalytics(urlEntry.shortCode);
  if (analytics && analytics.totalClicks === 2) {
    console.log('✅ Test 4 PASSED: Analytics work\n');
    console.log(`   Total clicks: ${analytics.totalClicks}`);
    console.log(`   Unique visitors: ${analytics.uniqueVisitors}\n`);
  } else {
    console.log('❌ Test 4 FAILED: Analytics not working\n');
  }
  
  // Test 5: Custom code
  const customUrl = URLService.createShortUrl('https://github.com', 'myrepo');
  if (customUrl.shortCode === 'myrepo') {
    console.log('✅ Test 5 PASSED: Custom code works\n');
  } else {
    console.log('❌ Test 5 FAILED: Custom code not working\n');
  }
  
  // Test 6: Get all URLs
  const allUrls = URLService.getAllUrls();
  if (allUrls.length >= 2) {
    console.log('✅ Test 6 PASSED: Get all URLs works\n');
    console.log(`   Total URLs: ${allUrls.length}\n`);
  } else {
    console.log('❌ Test 6 FAILED: Get all URLs not working\n');
  }
  
  console.log('🎉 All core functionality tests completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Start server: npm start');
  console.log('3. Test endpoints with curl or Postman');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}