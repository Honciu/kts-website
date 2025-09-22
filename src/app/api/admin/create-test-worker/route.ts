import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/admin/create-test-worker - Creates a test WORKER user for debugging
export async function POST() {
  try {
    console.log('🧪 Creating test worker...');
    
    // Check if a test worker already exists
    const existingWorker = await prisma.user.findFirst({
      where: {
        email: 'test-worker@kts.ro'
      }
    });

    if (existingWorker) {
      return NextResponse.json({
        success: true,
        message: 'Test worker already exists',
        data: {
          id: existingWorker.id,
          name: existingWorker.name,
          email: existingWorker.email,
          type: existingWorker.type
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 12);

    // Create test worker
    const testWorker = await prisma.user.create({
      data: {
        name: 'Lucrător Test',
        email: 'test-worker@kts.ro',
        phone: '+40700000001',
        password: hashedPassword,
        type: 'WORKER',
        salaryPercentage: 30,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        isActive: true,
        salaryPercentage: true,
        createdAt: true
      }
    });

    console.log('✅ Test worker created successfully:', testWorker);

    return NextResponse.json({
      success: true,
      message: 'Test worker created successfully',
      data: testWorker
    });

  } catch (error: any) {
    console.error('❌ Error creating test worker:', error);
    
    return NextResponse.json({
      success: false,
      error: `Failed to create test worker: ${error.message || error}`
    }, { status: 500 });
  }
}