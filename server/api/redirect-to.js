// 🔄 Redirect API - Proper 301 Redirects
// SOLVES: Redirect logic problem - now redirects properly instead of returning JSON

import { NextResponse } from 'next/server';
import db from '../lib/unified-database.js';

export async function GET(request, { params }) {
  try {
    const { code } = params;

    console.log(`🔄 Redirect request for: ${code}`);

    if (!code) {
      return NextResponse.json(
        { 
          error: 'Short code is required',
          code: 'MISSING_CODE',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }

    // Get URL from unified database
    const urlEntry = await db.getUrlByCode(code);
    if (!urlEntry) {
      console.log(`❌ URL not found: ${code}`);
      
      // Return HTML 404 page for better UX
      const html404 = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>URL Not Found</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                     display: flex; align-items: center; justify-content: center; 
                     min-height: 100vh; margin: 0; background: #f5f5f5; }
            .container { text-align: center; padding: 2rem; }
            .error-code { font-size: 4rem; color: #e74c3c; margin: 0; }
            .error-message { font-size: 1.5rem; color: #555; margin: 1rem 0; }
            .back-link { color: #3498db; text-decoration: none; }
            .back-link:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-code">404</div>
            <div class="error-message">Short URL not found</div>
            <a href="/" class="back-link">Create a new short URL</a>
          </div>
        </body>
        </html>
      `;
      
      return new NextResponse(html404, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Record comprehensive analytics before redirect
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct',
      country: request.headers.get('x-vercel-ip-country') || 'unknown',
      city: request.headers.get('x-vercel-ip-city') || 'unknown',
      region: request.headers.get('x-vercel-ip-region') || 'unknown',
      timezone: request.headers.get('x-vercel-ip-timezone') || 'unknown'
    };

    // Record click asynchronously (don't block redirect)
    db.recordClick(code, metadata).catch(error => {
      console.error('❌ Analytics recording failed:', error);
    });

    console.log(`✅ Redirecting: ${code} → ${urlEntry.original_url}`);

    // 🔥 KEY FIX: Proper 301 redirect instead of JSON response
    return NextResponse.redirect(urlEntry.original_url, 301);

  } catch (error) {
    console.error('❌ Redirect Error:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   display: flex; align-items: center; justify-content: center; 
                   min-height: 100vh; margin: 0; background: #f5f5f5; }
          .container { text-align: center; padding: 2rem; }
          .error-code { font-size: 4rem; color: #e74c3c; margin: 0; }
          .error-message { font-size: 1.5rem; color: #555; margin: 1rem 0; }
          .back-link { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-code">500</div>
          <div class="error-message">Internal Server Error</div>
          <a href="/" class="back-link">Go back home</a>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle HEAD requests for URL checking
export async function HEAD(request, { params }) {
  try {
    const { code } = params;

    if (!code) {
      return new NextResponse(null, { status: 400 });
    }

    const urlEntry = await db.getUrlByCode(code);
    if (!urlEntry) {
      return new NextResponse(null, { status: 404 });
    }

    // Return headers without redirect
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Length': '0',
        'Location': urlEntry.original_url
      }
    });

  } catch (error) {
    console.error('❌ HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}