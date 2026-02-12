// 🔄 Redirect Handler with PostgreSQL
import { NextResponse } from 'next/server';
import db from '../lib/postgres-db.js';

export async function GET(request, { params }) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { error: 'Short code is required' },
        { status: 400 }
      );
    }

    // Get URL from PostgreSQL
    const urlEntry = await db.getUrlByCode(code);
    if (!urlEntry) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Record analytics with rich metadata
    const metadata = {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct',
      country: request.headers.get('x-vercel-ip-country') || 'unknown',
      city: request.headers.get('x-vercel-ip-city') || 'unknown',
      region: request.headers.get('x-vercel-ip-region') || 'unknown'
    };

    // Record click asynchronously (don't block redirect)
    db.recordClick(code, metadata).catch(error => {
      console.error('Analytics recording failed:', error);
    });

    // Perform actual redirect
    return NextResponse.redirect(urlEntry.original_url, 301);

  } catch (error) {
    console.error('Redirect Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}