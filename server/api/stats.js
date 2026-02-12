import { NextResponse } from 'next/server';

// In-memory storage (shared with other API functions)
const urlDatabase = new Map();
const analyticsDatabase = new Map();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    const code = searchParams.get('code');

    if (code) {
      // Return stats for specific URL
      return getUrlStats(code, period);
    } else {
      // Return overall system stats
      return getSystemStats(period);
    }

  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getUrlStats(code, period) {
  const urlEntry = urlDatabase.get(code);
  if (!urlEntry) {
    return NextResponse.json(
      { error: 'Short URL not found' },
      { status: 404 }
    );
  }

  const analytics = analyticsDatabase.get(code) || [];
  const filteredAnalytics = filterAnalyticsByPeriod(analytics, period);

  // Click trends over time
  const clickTrends = getClickTrends(filteredAnalytics, period);
  
  // Geographic distribution
  const geographicStats = getGeographicStats(filteredAnalytics);
  
  // Device/browser breakdown
  const deviceStats = getDeviceStats(filteredAnalytics);
  
  // Time-based patterns
  const timePatterns = getTimePatterns(filteredAnalytics);

  return NextResponse.json({
    success: true,
    data: {
      shortCode: code,
      originalUrl: urlEntry.originalUrl,
      period,
      totalClicks: filteredAnalytics.length,
      clickTrends,
      geographicStats,
      deviceStats,
      timePatterns,
      performance: {
        averageClicksPerDay: getAverageClicksPerDay(filteredAnalytics, period),
        peakDay: getPeakDay(filteredAnalytics),
        conversionRate: calculateConversionRate(filteredAnalytics)
      }
    }
  });
}

function getSystemStats(period) {
  const allUrls = Array.from(urlDatabase.values());
  const allAnalytics = Array.from(analyticsDatabase.values()).flat();
  const filteredAnalytics = filterAnalyticsByPeriod(allAnalytics, period);

  // System overview
  const systemStats = {
    totalUrls: allUrls.length,
    totalClicks: filteredAnalytics.length,
    activeUrls: allUrls.filter(url => url.clicks > 0).length,
    averageClicksPerUrl: allUrls.length > 0 ? 
      Math.round(filteredAnalytics.length / allUrls.length) : 0,
    uniqueVisitors: new Set(filteredAnalytics.map(click => click.ip)).size
  };

  // Growth metrics
  const growthMetrics = calculateGrowthMetrics(allAnalytics, period);

  // Top performers
  const topPerformers = allUrls
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
    .map(url => ({
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      performance: calculateUrlPerformance(url, analyticsDatabase.get(url.shortCode) || [])
    }));

  return NextResponse.json({
    success: true,
    data: {
      period,
      systemStats,
      growthMetrics,
      topPerformers,
      recentActivity: getRecentActivity(filteredAnalytics),
      healthCheck: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    }
  });
}

// Helper functions
function filterAnalyticsByPeriod(analytics, period) {
  const now = new Date();
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90
  }[period] || 7;

  const cutoffDate = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
  return analytics.filter(click => new Date(click.timestamp) >= cutoffDate);
}

function getClickTrends(analytics, period) {
  const trends = {};
  analytics.forEach(click => {
    const date = click.timestamp.split('T')[0];
    trends[date] = (trends[date] || 0) + 1;
  });
  
  return Object.entries(trends)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getGeographicStats(analytics) {
  const countries = {};
  analytics.forEach(click => {
    const country = click.country || 'unknown';
    countries[country] = (countries[country] || 0) + 1;
  });
  
  return Object.entries(countries)
    .map(([country, clicks]) => ({ country, clicks }))
    .sort((a, b) => b.clicks - a.clicks);
}

function getDeviceStats(analytics) {
  const devices = {};
  const browsers = {};
  
  analytics.forEach(click => {
    const userAgent = click.userAgent || '';
    
    // Simple device detection
    if (userAgent.includes('Mobile')) {
      devices.mobile = (devices.mobile || 0) + 1;
    } else {
      devices.desktop = (devices.desktop || 0) + 1;
    }
    
    // Simple browser detection
    if (userAgent.includes('Chrome')) {
      browsers.chrome = (browsers.chrome || 0) + 1;
    } else if (userAgent.includes('Firefox')) {
      browsers.firefox = (browsers.firefox || 0) + 1;
    } else if (userAgent.includes('Safari')) {
      browsers.safari = (browsers.safari || 0) + 1;
    } else {
      browsers.other = (browsers.other || 0) + 1;
    }
  });
  
  return { devices, browsers };
}

function getTimePatterns(analytics) {
  const hours = {};
  const days = {};
  
  analytics.forEach(click => {
    const date = new Date(click.timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    hours[hour] = (hours[hour] || 0) + 1;
    days[day] = (days[day] || 0) + 1;
  });
  
  return { hours, days };
}

function getAverageClicksPerDay(analytics, period) {
  const periodDays = { '7d': 7, '30d': 30, '90d': 90 }[period] || 7;
  return Math.round(analytics.length / periodDays);
}

function getPeakDay(analytics) {
  const dailyClicks = {};
  analytics.forEach(click => {
    const date = click.timestamp.split('T')[0];
    dailyClicks[date] = (dailyClicks[date] || 0) + 1;
  });
  
  const peakEntry = Object.entries(dailyClicks)
    .sort(([,a], [,b]) => b - a)[0];
  
  return peakEntry ? { date: peakEntry[0], clicks: peakEntry[1] } : null;
}

function calculateConversionRate(analytics) {
  const uniqueIPs = new Set(analytics.map(click => click.ip));
  const directTraffic = analytics.filter(click => 
    click.referer === 'direct' || !click.referer
  ).length;
  
  return uniqueIPs.size > 0 ? Math.round((directTraffic / uniqueIPs.size) * 100) : 0;
}

function calculateUrlPerformance(url, analytics) {
  const daysSinceCreation = Math.ceil(
    (Date.now() - new Date(url.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    clicksPerDay: daysSinceCreation > 0 ? Math.round(url.clicks / daysSinceCreation) : url.clicks,
    engagementScore: calculateEngagementScore(analytics),
    trendDirection: calculateTrendDirection(analytics)
  };
}

function calculateEngagementScore(analytics) {
  if (analytics.length === 0) return 0;
  
  const uniqueIPs = new Set(analytics.map(click => click.ip));
  const repeatVisits = analytics.length - uniqueIPs.size;
  
  return Math.min(100, Math.round((repeatVisits / analytics.length) * 100));
}

function calculateTrendDirection(analytics) {
  const recentClicks = analytics.slice(-10).length;
  const olderClicks = analytics.slice(-20, -10).length;
  
  if (recentClicks > olderClicks) return 'up';
  if (recentClicks < olderClicks) return 'down';
  return 'stable';
}

function calculateGrowthMetrics(allAnalytics, period) {
  const filteredAnalytics = filterAnalyticsByPeriod(allAnalytics, period);
  const previousPeriodAnalytics = filterAnalyticsByPeriod(allAnalytics, 
    period === '7d' ? '14d' : period === '30d' ? '60d' : '180d'
  ).slice(0, filteredAnalytics.length);
  
  const growthRate = previousPeriodAnalytics.length > 0 ? 
    Math.round(((filteredAnalytics.length - previousPeriodAnalytics.length) / previousPeriodAnalytics.length) * 100) : 0;
  
  return {
    currentPeriodClicks: filteredAnalytics.length,
    previousPeriodClicks: previousPeriodAnalytics.length,
    growthRate,
    trend: growthRate > 0 ? 'growing' : growthRate < 0 ? 'declining' : 'stable'
  };
}

function getRecentActivity(analytics) {
  return analytics
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
    .map(click => ({
      timestamp: click.timestamp,
      shortCode: click.shortCode || 'unknown',
      ip: click.ip,
      country: click.country
    }));
}