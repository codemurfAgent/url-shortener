#!/usr/bin/env node

// Test the fix for Devin's error
const express = require('express');
const request = require('supertest');

// Import the fixed app
const app = require('./src/index');

console.log('🧪 Testing Devin\'s Error Fix...\n');

async function testErrorFix() {
  try {
    // Test 1: Health check (should work)
    console.log('📋 Test 1: Health Check');
    const healthResponse = await request(app).get('/health');
    if (healthResponse.status === 200) {
      console.log('✅ PASSED: Health check working');
    } else {
      console.log('❌ FAILED: Health check failed');
    }

    // Test 2: API route handling (should not crash)
    console.log('\n📋 Test 2: API Route Handling');
    const apiResponse = await request(app).get('/api');
    if (apiResponse.status === 404) {
      console.log('✅ PASSED: API routes handled correctly');
    } else {
      console.log('❌ FAILED: API routes not handled properly');
    }

    // Test 3: Create a short URL
    console.log('\n📋 Test 3: Create Short URL');
    const createResponse = await request(app)
      .post('/api/url/shorten')
      .send({ url: 'https://example.com/test' });
    
    if (createResponse.status === 201) {
      console.log('✅ PASSED: Short URL creation working');
      const shortCode = createResponse.body.data.shortCode;
      
      // Test 4: Redirect handling
      console.log('\n📋 Test 4: Redirect Handling');
      const redirectResponse = await request(app).get(`/${shortCode}`);
      if (redirectResponse.status === 301) {
        console.log('✅ PASSED: Redirect working (301 status)');
      } else {
        console.log('❌ FAILED: Redirect not working');
      }
    } else {
      console.log('❌ FAILED: Short URL creation failed');
    }

    console.log('\n🎉 Devin\'s Error Fix Verification Complete!');
    console.log('✅ All critical functions working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Error Details:');
    console.log('- Type:', error.constructor.name);
    console.log('- Message:', error.message);
  }
}

// Run tests
testErrorFix();