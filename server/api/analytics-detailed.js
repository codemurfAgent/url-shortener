// 📊 Detailed Analytics API - Unified Database
// SOLVES: Data sharing problem with comprehensive analytics

import { NextResponse } from 'next/server';
import db from '../lib/unified-database.js';

export async function GET(request) {
  try {
    console.log('📊 Analytics request...');
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const period = searchParams.get('period') || '7d';
    const format = searchParams.get('format') || 'json';

    // Validate period
    const validPeriods = ['1d', '7d', '30d', '90d'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { 
          error: 'Invalid period. Use 1d, 7d, 30d, or 90d',
          code: 'INVALID_PERIOD',
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      );
    }

    if (code) {
      // Get analytics for specific URL
      const analytics = await db.getAnalytics(code, period);
      
      if (!analytics) {
        return NextResponse.json(
          { 
            error: 'Short URL not found',
            code: 'URL_NOT_FOUND',
            timestamp: new Date().toISOString()
          }, 
          { status: 404 }
        );
      }

      // Add additional computed metrics
      const enhancedAnalytics = {
        ...analytics,
        performance: {
          clicksPerDay: Math.round(analytics.periodClicks / parseInt(period)),
          engagementRate: analytics.uniqueVisitors > 0 ? 
            Math.round((analytics.totalClicks / analytics.uniqueVisitors) * 100) : 0,
          averageTimeBetweenClicks: analytics.recentClicks.length > 1 ? 
            Math.round((new Date(analytics.recentClicks[0].created_at) - 
                        new Date(analytics.recentClicks[analytics.recentClicks.length - 1].created_at)) / 
                        (analytics.recentClicks.length - 1) / 1000 / 60) : 0
        },
        trends: {
          peakHour: getPeakHour(analytics.recentClicks),
          peakDay: getPeakDay(analytics.recentClicks),
          topCountries: getTopEntries(analytics.breakdowns.countries, 5),
          topDevices: getTopEntries(analytics.breakdowns.devices, 3),
          topBrowsers: getTopEntries(analytics.breakdowns.browsers, 3)
        },
        predictions: {
          nextMonthClicks: predictNextMonth(analytics.totalClicks, period),
          growthRate: calculateGrowthRate(analytics.totalClicks, analytics.last7DaysClicks)
        }
      };

      console.log(`✅ Analytics provided for: ${code}`);

      // Support different response formats
      if (format === 'csv') {
        const csv = convertToCSV(enhancedAnalytics);
        return new NextResponse(csv, {
          headers: { 'Content-Type': 'text/csv' }
        });
      }

      return NextResponse.json({
        success: true,
        data: enhancedAnalytics,
        metadata: {
          period,
          generated_at: new Date().toISOString(),
          total_records: analytics.recentClicks.length
        }
      });

    } else {
      // Return overview analytics
      const overview = await db.getOverviewAnalytics();
      
      console.log('✅ Overview analytics provided');

      const enhancedOverview = {
        ...overview,
        health: {
          database_status: 'connected',
          server_uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          active_rate: overview.totalUrls > 0 ? 
            Math.round((overview.activeUrls / overview.totalUrls) * 100) : 0
        },
        insights: {
          most_active_url: overview.topUrls[0]?.shortCode || 'none',
          busiest_country: Object.entries(overview.distributions.countries || {})
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown',
          primary_device: Object.keys(overview.distributions.devices || {})
            .sort((a, b) => (overview.distributions.devices[b] || 0) - (overview.distributions.devices[a] || 0))[0] || 'unknown'
        }
      };

      return NextResponse.json({
        success: true,
        data: enhancedOverview,
        metadata: {
          generated_at: new Date().toISOString(),
          data_freshness: 'real-time'
        }
      });
    }

  } catch (error) {
    console.error('❌ Analytics Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'ANALYTICS_ERROR',
        timestamp: new Date().toISOString(),
        details: error.message
      }, 
      { status: 500 }
    );
  }
}

// Helper functions for analytics calculations
function getPeakHour(clicks) {
  if (clicks.length === 0) return null;
  
  const hourCounts = {};
  clicks.forEach(click => {
    const hour = new Date(click.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHour = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return peakHour ? parseInt(peakHour[0]) : null;
}

function getPeakDay(clicks) {
  if (clicks.length === 0) return null;
  
  const dayCounts = {};
  clicks.forEach(click => {
    const day = new Date(click.created_at).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  
  const peakDay = Object.entries(dayCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  return peakDay ? parseInt(peakDay[0]) : null;
}

function getTopEntries(breakdown, limit = 5) {
  return Object.entries(breakdown || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([key, value]) => ({ name: key, count: value }));
}

function predictNextMonth(currentClicks, period) {
  // Simple linear prediction
  const periodDays = { '1d': 1, '7d': 7, '30d': 30, '90d': 90 }[period] || 7;
  const dailyAverage = currentClicks / periodDays;
  return Math.round(dailyAverage * 30);
}

function calculateGrowthRate(totalClicks, last7DaysClicks) {
  if (last7DaysClicks === 0) return 0;
  const dailyAverage = last7DaysClicks / 7;
  const overallDailyAverage = totalClicks / 30; // Assume 30 days total
  return Math.round(((dailyAverage - overallDailyAverage) / overallDailyAverage) * 100);
}

function convertToCSV(data) {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Short Code', data.shortCode],
    ['Original URL', data.originalUrl],
    ['Total Clicks', data.totalClicks],
    ['Unique Visitors', data.uniqueVisitors],
    ['Period Clicks', data.periodClicks],
    ['Today Clicks', data.todayClicks],
    ['Last 7 Days', data.last7DaysClicks]
  ];

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}