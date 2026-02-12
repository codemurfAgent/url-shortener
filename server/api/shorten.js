import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import db from '../lib/database.js';

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

    // Generate or use custom code
    let shortCode;
    if (customCode) {
      const existingUrl = db.getUrlByCode(customCode);
      if (existingUrl) {
        return NextResponse.json(
          { error: 'Custom code already exists' },
          { status: 400 }
        );
      }
      shortCode = customCode;
    } else {
      // Generate unique code
      shortCode = nanoid(6);
      while (db.getUrlByCode(shortCode)) {
        shortCode = nanoid(6);
      }
    }

    // Create URL entry using shared database
    const urlEntry = db.createUrl(originalUrl, shortCode);

    const host = request.headers.get('host') || 'vercel.app';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';

    return NextResponse.json({
      success: true,
      data: {
        id: urlEntry.id,
        originalUrl: urlEntry.originalUrl,
        shortCode: urlEntry.shortCode,
        shortUrl: `${protocol}://${host}/${urlEntry.shortCode}`,
        createdAt: urlEntry.createdAt
      }
    });

  } catch (error) {
    console.error('Shorten API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}