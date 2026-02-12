// 🏥 Health Check with PostgreSQL
import { NextResponse } from 'next/server';
import db from '../lib/postgres-db.js';

export async function GET() {
  try {
    const healthCheck = await db.healthCheck();
    
    return NextResponse.json({
      ...healthCheck,
      platform: 'vercel-serverless',
      version: '2.1.0-postgres',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'ERROR',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}