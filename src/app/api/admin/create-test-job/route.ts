import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/create-test-job - Create a test job for workflow validation
 * This creates a complete test job assigned to Robert for testing purposes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 ADMIN TEST: Creating test job for workflow validation...');
    
    const testJobData = {
      clientName: `Test Client ${Date.now()}`,
      clientPhone: '+40700123456',
      address: `Strada Test nr. ${Math.floor(Math.random() * 100)}, București`,
      serviceName: '🧪 Test Expert Lucrare',
      serviceDescription: 'Job de test pentru validarea workflow-ului complet: creare → atribuire → acceptare → finalizare → câștiguri',
      specialInstructions: 'Acesta este un job de test pentru verificarea funcționării sistemului. Se poate finaliza cu date mock.',
      assignedEmployeeId: 'cmfudasin0001v090qs1frclc', // Robert's ID
      assignedEmployeeName: 'Robert',
      status: 'ASSIGNED',
      priority: 'NORMAL',
      createdById: 'admin1'
    };

    // Create test job in database
    const job = await prisma.job.create({
      data: testJobData,
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Transform for compatibility
    const transformedJob = {
      id: job.id,
      clientName: job.clientName,
      clientPhone: job.clientPhone,
      address: job.address,
      serviceName: job.serviceName,
      serviceDescription: job.serviceDescription,
      specialInstructions: job.specialInstructions,
      assignedEmployeeId: job.assignedEmployeeId,
      assignedEmployeeName: job.assignedEmployeeName,
      status: job.status.toLowerCase(),
      priority: job.priority.toLowerCase(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString()
    };

    // Create notification for Robert
    await prisma.notification.create({
      data: {
        type: 'JOB_ASSIGNED',
        title: '🧪 Job Test Creat',
        message: `Ai primit un job de test: ${job.serviceName}. Poți să-l finalizezi cu date mock pentru testare.`,
        jobId: job.id,
        workerId: job.assignedEmployeeId,
        urgent: false
      }
    });

    console.log('✅ Test job created successfully:', {
      id: job.id,
      clientName: job.clientName,
      serviceName: job.serviceName,
      assignedTo: job.assignedEmployeeName
    });

    return NextResponse.json({
      success: true,
      data: transformedJob,
      message: 'Test job created successfully',
      instructions: [
        '1. Jobul a fost atribuit lui Robert',
        '2. Robert poate accepta jobul din Worker Dashboard', 
        '3. Poate finaliza jobul cu date mock',
        '4. Sistemul va actualiza automat earnings și statistici',
        '5. Adminul va vedea jobul completat în istoric'
      ],
      timestamp: new Date().toISOString(),
      version: Date.now()
    });

  } catch (error) {
    console.error('❌ Error creating test job:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET method to show usage instructions
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    endpoint: 'POST /api/admin/create-test-job',
    description: 'Creates a test job assigned to Robert for workflow validation',
    instructions: [
      '1. Send POST request to this endpoint',
      '2. Test job will be created and assigned to Robert',
      '3. Use for testing complete job lifecycle',
      '4. Robert can complete with mock data for testing'
    ]
  });
}