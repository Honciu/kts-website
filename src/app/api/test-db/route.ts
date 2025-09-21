import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test query
    const userCount = await prisma.user.count()
    const jobCount = await prisma.job.count()
    const notificationCount = await prisma.notification.count()
    
    console.log(`📊 Database stats: ${userCount} users, ${jobCount} jobs, ${notificationCount} notifications`)
    
    // Test creating a simple record (then delete it)
    const testUser = await prisma.user.create({
      data: {
        name: 'Test Connection',
        email: `test-${Date.now()}@test.com`,
        type: 'WORKER',
        password: 'test123',
        isActive: false
      }
    })
    
    // Delete the test user
    await prisma.user.delete({
      where: { id: testUser.id }
    })
    
    console.log('✅ Database write/delete test successful')
    
    const response = {
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      stats: {
        users: userCount,
        jobs: jobCount,
        notifications: notificationCount
      },
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    
    const response = {
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Missing',
      prismaVersion: '6.16.2'
    }
    
    return NextResponse.json(response, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}