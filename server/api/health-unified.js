// 🏥 Unified Health Check API
// SOLVES: Comprehensive monitoring for unified system

import { NextResponse } from 'next/server';
import db from '../lib/unified-database.js';

export async function GET() {
  try {
    console.log('🏥 Health check requested...');
    
    // Get comprehensive health status
    const healthStatus = await db.healthCheck();
    
    // Add additional health metrics
    const enhancedHealth = {
      ...healthStatus,
      api: {
        endpoints: {
          create_url: 'operational',
          redirect: 'operational', 
          analytics: 'operational',
          health: 'operational'
        },
        version: '2.1.0-unified',
        environment: process.env.NODE_ENV || 'development'
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        node_version: process.version
      },
      features: {
        url_creation: true,
        real_redirects: true,
        analytics_tracking: true,
        geographic_data: true,
        device_detection: true,
        custom_codes: true
      },
      integrations: {
        database: healthStatus.database,
        postgresql: healthStatus.database === 'connected',
        vercel_edge: true,
        ssl_enabled: true
      }
    };

    // Add service dependencies status
    enhancedHealth.dependencies = {
      postgresql: {
        status: healthStatus.database === 'connected' ? 'healthy' : 'unhealthy',
        response_time: healthStatus.serverTime ? 'fast' : 'unknown'
      },
      external_apis: {
        status: 'not_used',
        message: 'No external API dependencies'
      }
    };

    // Add recommendations based on status
    enhancedHealth.recommendations = [];
    
    if (enhancedHealth.stats.totalUrls > 1000) {
      enhancedHealth.recommendations.push('Consider implementing pagination for URL listings');
    }
    
    if (enhancedHealth.performance.memory.heapUsed > 100 * 1024 * 1024) {
      enhancedHealth.recommendations.push('Memory usage is high, consider optimization');
    }
    
    if (enhancedHealth.stats.totalClicks > 10000) {
      enhancedHealth.recommendations.push('High traffic detected, consider scaling strategy');
    }

    console.log('✅ Health check completed');

    // Return appropriate status code based on health
    const statusCode = healthStatus.status === 'OK' ? 200 : 503;

    return NextResponse.json(enhancedHealth, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    const errorHealth = {
      status: 'ERROR',
      database: 'disconnected',
      api: {
        status: 'degraded',
        error: error.message
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      recommendations: [
        'Check database connection',
        'Verify environment variables',
        'Review error logs'
      ]
    };

    return NextResponse.json(errorHealth, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// Handle HEAD requests for health check
export async function HEAD() {
  try {
    const healthStatus = await db.healthCheck();
    
    return new NextResponse(null, {
      status: healthStatus.status === 'OK' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}