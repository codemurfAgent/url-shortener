// 📊 Analytics with PostgreSQL
import { NextResponse } from 'next/server';
import db from '../lib/postgres-db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      // Return overview analytics
      const overview = await db.getOverviewAnalytics();
      
      return NextResponse.json({
        success: true,
        data: overview
      });
    }

    // Get analytics for specific URL
    const analytics = await db.getAnalytics(code);
    if (!analytics) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Add additional computed metrics
    const computedAnalytics = {
      ...analytics,
      // Geographic breakdown
      geographicBreakdown: analytics.recentClicks.reduce((acc, click) => {
        const country = click.country || 'unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {}),
      
      // Referer breakdown
      refererBreakdown: analytics.recentClicks.reduce((acc, click) => {
        const referer = click.referer || 'direct';
        acc[referer] = (acc[referer] || 0) + 1;
        return acc;
      }, {}),
      
      // Top countries
      topCountries: analytics.recentClicks
        .filter(click => click.country && click.country !== 'unknown')
        .reduce((acc, click) => {
          acc[click.country] = (acc[click.country] || 0) + 1;
          return acc;
        }, {}),
        
      // Engagement metrics
      engagementRate: analytics.totalClicks > 0 ? 
        Math.round((analytics.uniqueVisitors / analytics.totalClicks) * 100) : 0
    };

    return NextResponse.json({
      success: true,
      data: computedAnalytics
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}