// 🔗 URL Shortening with PostgreSQL
import { NextResponse } from 'next/server';
import db from '../lib/postgres-db.js';

export async function POST(request) {
  try {
    const { url: originalUrl, customCode } = await request.json();

    // Validate input
    if (!originalUrl) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Create URL using PostgreSQL
    const urlEntry = await db.createUrl(originalUrl, customCode);

    const host = request.headers.get('host') || 'vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';

    return NextResponse.json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl: urlEntry.original_url,
        shortCode: urlEntry.short_code,
        shortUrl: `${protocol}://${host}/${urlEntry.short_code}`,
        createdAt: urlEntry.created_at
      }
    });

  } catch (error) {
    console.error('Shorten API Error:', error);
    
    const errorMessage = error.message || 'Internal server error';
    const statusCode = errorMessage.includes('already exists') ? 400 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}