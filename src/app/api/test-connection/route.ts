import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🧪 Test connection endpoint called');
    
    // Test database connection
    let dbTest = null;
    try {
      const userCount = await prisma.user.count();
      dbTest = {
        connected: true,
        userCount,
        message: `Database connected - found ${userCount} users`
      };
    } catch (dbError: any) {
      dbTest = {
        connected: false,
        error: dbError.message,
        message: 'Database connection failed'
      };
    }
    
    return NextResponse.json({
      success: true,
      message: 'API connectivity test successful',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        databasePrefix: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'undefined'
      },
      database: dbTest
    });
  } catch (error: any) {
    console.error('❌ Test connection error:', error);
    return NextResponse.json({
      success: false,
      error: `Test connection failed: ${error.message || error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
