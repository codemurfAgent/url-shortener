import { NextResponse } from 'next/server';
import db from '../lib/database.js';

export async function GET() {
  try {
    const allUrls = db.getAllUrls();
    
    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      platform: 'vercel-serverless',
      database: {
        totalUrls: allUrls.length,
        totalClicks: allUrls.reduce((sum, url) => sum + url.clicks, 0)
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}