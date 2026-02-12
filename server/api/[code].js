import { NextResponse } from 'next/server';
import db from '../lib/database.js';

// Handle GET requests for actual redirects
export async function GET(request, { params }) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'Short code is required' },
        { status: 400 }
      );
    }

    // Get URL from shared database
    const urlEntry = db.getUrlByCode(code);
    if (!urlEntry) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Record analytics
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct',
      country: request.headers.get('x-vercel-ip-country') || 'unknown',
      city: request.headers.get('x-vercel-ip-city') || 'unknown'
    };

    db.recordClick(code, metadata);

    // Perform actual redirect using NextResponse.redirect
    return NextResponse.redirect(urlEntry.originalUrl, 301);

  } catch (error) {
    console.error('Redirect Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}