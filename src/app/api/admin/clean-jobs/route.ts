import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/admin/clean-jobs - Clean all jobs from database (ADMIN ONLY)
 * This is a dangerous operation that removes all jobs and related data
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 ADMIN CLEAN: Starting complete database cleanup...');
    
    // Delete in correct order due to foreign key constraints
    
    // 1. Delete all job updates first
    const deletedUpdates = await prisma.jobUpdate.deleteMany({});
    console.log(`✅ Deleted ${deletedUpdates.count} job updates`);
    
    // 2. Delete all notifications
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.count} notifications`);
    
    // 3. Finally delete all jobs
    const deletedJobs = await prisma.job.deleteMany({});
    console.log(`✅ Deleted ${deletedJobs.count} jobs`);
    
    console.log('🎉 Database cleanup completed successfully!');
    
    return NextResponse.json({
      success: true,
      data: {
        deletedJobs: deletedJobs.count,
        deletedUpdates: deletedUpdates.count,
        deletedNotifications: deletedNotifications.count
      },
      message: 'Database cleaned successfully',
      timestamp: new Date().toISOString(),
      version: Date.now()
    });

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET method to prevent accidental deletion
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Use DELETE method to clean database',
      warning: 'This operation will delete ALL jobs and cannot be undone'
    },
    { status: 405 }
  );
}