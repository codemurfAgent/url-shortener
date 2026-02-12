// 🔗 Create URL API - Unified Database Solution
// SOLVES: Data isolation problem with shared PostgreSQL

import { NextResponse } from 'next/server';
import db from '../lib/unified-database.js';

export async function POST(request) {
  try {
    console.log('🔗 Creating URL...');
    
    const { url: originalUrl, customCode } = await request.json();

    // Validate input
    if (!originalUrl) {
      return NextResponse.json(
        { 
          error: 'URL is required',
          code: 'MISSING_URL',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (urlError) {
      return NextResponse.json(
        { 
          error: 'Invalid URL format',
          details: 'Please provide a valid HTTP/HTTPS URL',
          code: 'INVALID_URL',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }

    // Validate custom code if provided
    if (customCode) {
      if (customCode.length < 3 || customCode.length > 10) {
        return NextResponse.json(
          { 
            error: 'Custom code must be 3-10 characters long',
            code: 'INVALID_CUSTOM_CODE',
            timestamp: new Date().toISOString()
          }, 
          { status: 400 }
        );
      }

      if (!/^[a-zA-Z0-9-_]+$/.test(customCode)) {
        return NextResponse.json(
          { 
            error: 'Custom code can only contain letters, numbers, hyphens, and underscores',
            code: 'INVALID_CUSTOM_CODE_FORMAT',
            timestamp: new Date().toISOString()
          }, 
          { status: 400 }
        );
      }
    }

    // Create URL using unified database
    const urlEntry = await db.createUrl(originalUrl, customCode);

    const host = request.headers.get('host') || 'vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';

    const responseData = {
      id: urlEntry.id,
      originalUrl: urlEntry.original_url,
      shortCode: urlEntry.short_code,
      shortUrl: `${protocol}://${host}/${urlEntry.short_code}`,
      createdAt: urlEntry.created_at,
      clicks: 0,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${protocol}://${host}/${urlEntry.short_code}`)}`
    };

    console.log(`✅ URL Created: ${urlEntry.short_code} → ${urlEntry.original_url}`);

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Short URL created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Create URL Error:', error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.message.includes('already exists')) {
      statusCode = 409;
      errorCode = 'CUSTOM_CODE_EXISTS';
    } else if (error.message.includes('Invalid URL')) {
      statusCode = 400;
      errorCode = 'INVALID_URL';
    }

    return NextResponse.json(
      { 
        error: error.message,
        code: errorCode,
        timestamp: new Date().toISOString(),
        details: 'Failed to create short URL'
      }, 
      { status: statusCode }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}