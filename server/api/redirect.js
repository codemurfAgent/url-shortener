import { NextResponse } from 'next/server';

// In-memory storage (shared with other API functions)
const urlDatabase = new Map();
const analyticsDatabase = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    const urlEntry = urlDatabase.get(code);
    if (!urlEntry) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Record analytics
    const metadata = {
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct'
    };

    const analytics = analyticsDatabase.get(code) || [];
    analytics.push(metadata);
    analyticsDatabase.set(code, analytics);

    // Increment click count
    urlEntry.clicks += 1;
    urlDatabase.set(code, urlEntry);

    return NextResponse.json({
      success: true,
      data: {
        originalUrl: urlEntry.originalUrl,
        shortCode: urlEntry.shortCode,
        clicks: urlEntry.clicks,
        analytics: {
          totalClicks: analytics.length,
          recentClicks: analytics.slice(-5)
        }
      }
    });

  } catch (error) {
    console.error('Redirect API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    const urlEntry = urlDatabase.get(code);
    if (!urlEntry) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Record analytics with more detailed metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || 'direct',
      country: request.headers.get('x-vercel-ip-country') || 'unknown',
      city: request.headers.get('x-vercel-ip-city') || 'unknown'
    };

    const analytics = analyticsDatabase.get(code) || [];
    analytics.push(metadata);
    analyticsDatabase.set(code, analytics);

    // Increment click count
    urlEntry.clicks += 1;
    urlDatabase.set(code, urlEntry);

    return NextResponse.json({
      success: true,
      message: 'Click recorded successfully',
      data: {
        originalUrl: urlEntry.originalUrl,
        shortCode: urlEntry.shortCode,
        totalClicks: urlEntry.clicks
      }
    });

  } catch (error) {
    console.error('Redirect POST Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}