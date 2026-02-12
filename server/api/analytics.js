import { NextResponse } from 'next/server';
import db from '../lib/database.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      // Return overview analytics if no code provided
      return getOverviewAnalytics();
    }

    // Get analytics for specific URL using shared database
    const analyticsData = db.getAnalytics(code);
    if (!analyticsData) {
      return NextResponse.json(
        { error: 'Short URL not found' },
        { status: 404 }
      );
    }

    // Calculate additional statistics
    const today = new Date().toISOString().split('T')[0];
    const todayClicks = analyticsData.clicks.filter(click => 
      click.timestamp.startsWith(today)
    ).length;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const last7DaysClicks = analyticsData.clicks.filter(click => 
      new Date(click.timestamp) >= last7Days
    ).length;

    // Geographic breakdown
    const countries = {};
    analyticsData.clicks.forEach(click => {
      const country = click.country || 'unknown';
      countries[country] = (countries[country] || 0) + 1;
    });

    // Top referers
    const referers = {};
    analyticsData.clicks.forEach(click => {
      const referer = click.referer || 'direct';
      referers[referer] = (referers[referer] || 0) + 1;
    });

    const topReferers = Object.entries(referers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([referer, count]) => ({ referer, count }));

    return NextResponse.json({
      success: true,
      data: {
        shortCode: analyticsData.shortCode,
        originalUrl: analyticsData.originalUrl,
        totalClicks: analyticsData.totalClicks,
        uniqueVisitors: analyticsData.uniqueVisitors,
        todayClicks,
        last7DaysClicks,
        createdAt: analyticsData.createdAt,
        geographicBreakdown: countries,
        recentClicks: analyticsData.clicks.slice(-10).reverse(),
        topReferers
      }
    });

  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getOverviewAnalytics() {
  const allUrls = db.getAllUrls();
  
  // Get analytics for all URLs
  const allAnalyticsData = allUrls.map(url => db.getAnalytics(url.shortCode)).filter(Boolean);
  
  const totalUrls = allUrls.length;
  const totalClicks = allUrls.reduce((sum, url) => sum + url.clicks, 0);
  const averageClicksPerUrl = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;

  const topUrls = allUrls
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)
    .map(url => ({
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks
    }));

  // Calculate unique visitors across all URLs
  const allClicks = allAnalyticsData.flatMap(data => data.clicks);
  const uniqueVisitors = new Set(allClicks.map(click => click.ip)).size;

  return NextResponse.json({
    success: true,
    data: {
      totalUrls,
      totalClicks,
      averageClicksPerUrl,
      topUrls,
      uniqueVisitors
    }
  });
}