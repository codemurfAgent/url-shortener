// 🧪 Unified Implementation Test Suite
// Tests the fixed, production-ready URL shortener

const request = require('supertest');
const app = require('./FIXED_UNIFIED_IMPLEMENTATION');

console.log('🧪 Testing Fixed Unified Implementation...\n');

async function runTests() {
  const testResults = [];

  // Test 1: Health Check
  try {
    console.log('📋 Test 1: Health Check');
    const response = await request(app).get('/health');
    
    if (response.status === 200 && response.body.status === 'OK') {
      console.log('✅ PASSED: Health check working');
      testResults.push({ test: 'Health Check', status: 'PASS' });
    } else {
      console.log('❌ FAILED: Health check failed');
      testResults.push({ test: 'Health Check', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    testResults.push({ test: 'Health Check', status: 'ERROR' });
  }

  // Test 2: Create Short URL
  try {
    console.log('\n📋 Test 2: Create Short URL');
    const response = await request(app)
      .post('/api/url/shorten')
      .send({ url: 'https://example.com/test' });
    
    if (response.status === 201 && response.body.success) {
      console.log('✅ PASSED: Short URL creation working');
      testResults.push({ test: 'Create Short URL', status: 'PASS' });
      return response.body.data.shortCode; // Return for next test
    } else {
      console.log('❌ FAILED: Short URL creation failed');
      testResults.push({ test: 'Create Short URL', status: 'FAIL' });
      return null;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    testResults.push({ test: 'Create Short URL', status: 'ERROR' });
    return null;
  }
}

async function testRedirect(shortCode) {
  if (!shortCode) {
    testResults.push({ test: 'URL Redirect', status: 'SKIP' });
    return;
  }

  try {
    console.log('\n📋 Test 3: URL Redirect');
    const response = await request(app).get(`/${shortCode}`);
    
    // Should return 301 redirect
    if (response.status === 302 || response.status === 301) {
      console.log('✅ PASSED: URL redirect working');
      testResults.push({ test: 'URL Redirect', status: 'PASS' });
    } else {
      console.log('❌ FAILED: URL redirect not working');
      testResults.push({ test: 'URL Redirect', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    testResults.push({ test: 'URL Redirect', status: 'ERROR' });
  }
}

async function testAnalytics(shortCode) {
  if (!shortCode) {
    testResults.push({ test: 'Analytics', status: 'SKIP' });
    return;
  }

  try {
    console.log('\n📋 Test 4: Analytics');
    const response = await request(app).get(`/api/analytics/${shortCode}`);
    
    if (response.status === 200 && response.body.success) {
      console.log('✅ PASSED: Analytics working');
      testResults.push({ test: 'Analytics', status: 'PASS' });
    } else {
      console.log('❌ FAILED: Analytics not working');
      testResults.push({ test: 'Analytics', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    testResults.push({ test: 'Analytics', status: 'ERROR' });
  }
}

async function testCustomCode() {
  try {
    console.log('\n📋 Test 5: Custom Code');
    const response = await request(app)
      .post('/api/url/shorten')
      .send({ url: 'https://example.com/custom', customCode: 'mycustom' });
    
    if (response.status === 201 && response.body.data.shortCode === 'mycustom') {
      console.log('✅ PASSED: Custom code working');
      testResults.push({ test: 'Custom Code', status: 'PASS' });
    } else {
      console.log('❌ FAILED: Custom code not working');
      testResults.push({ test: 'Custom Code', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    testResults.push({ test: 'Custom Code', status: 'ERROR' });
  }
}

async function testErrorHandling() {
  try {
    console.log('\n📋 Test 6: Error Handling');
    
    // Test invalid URL
    const response = await request(app)
      .post('/api/url/shorten')
      .send({ url: 'invalid-url' });
    
    if (response.status === 400 && response.body.error) {
      console.log('✅ PASSED: Error handling working');
      testResults.push({ test: 'Error Handling', status: 'PASS' });
    } else {
      console.log('❌ FAILED: Error handling not working');
      testResults.push({ test: 'Error Handling', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    testResults.push({ test: 'Error Handling', status: 'ERROR' });
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting URL Shortener Test Suite\n');
  
  const shortCode = await runTests();
  await testRedirect(shortCode);
  await testAnalytics(shortCode);
  await testCustomCode();
  await testErrorHandling();
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  const skipped = testResults.filter(r => r.status === 'SKIP').length;
  
  testResults.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : 
                   result.status === 'ERROR' ? '🚨' : '⏭️';
    console.log(`${status} ${result.test}: ${result.status}`);
  });
  
  console.log('\n📈 RESULTS:');
  console.log(`- Passed: ${passed}`);
  console.log(`- Failed: ${failed}`);
  console.log(`- Errors: ${errors}`);
  console.log(`- Skipped: ${skipped}`);
  
  const total = passed + failed + errors + skipped;
  const successRate = Math.round((passed / total) * 100);
  
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  if (successRate >= 80) {
    console.log('🎉 EXCELLENT: Implementation ready for production!');
  } else if (successRate >= 60) {
    console.log('⚠️  GOOD: Some issues need attention');
  } else {
    console.log('🚨 CRITICAL: Major issues need fixing');
  }
}

// Run tests
runAllTests().catch(console.error);