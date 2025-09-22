import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users - Obține toți utilizatorii (pentru statistici admin)
export async function GET(request: NextRequest) {
  try {
    console.log('👥 GET /api/users - Loading all users from database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
        isActive: true,
        phone: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${users.length} users in database`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.type}) - Active: ${user.isActive}`);
    });

    return NextResponse.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString(),
      version: Date.now()
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users'
      },
      { status: 500 }
    );
  }
}