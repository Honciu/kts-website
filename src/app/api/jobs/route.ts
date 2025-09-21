import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/jobs - Obține toate joburile
export async function GET(request: NextRequest) {
  try {
    const jobs = await prisma.job.findMany({
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
        },
        updates: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform pentru compatibilitate cu frontend-ul existent
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      clientName: job.clientName,
      clientPhone: job.clientPhone,
      address: job.address,
      serviceName: job.serviceName,
      serviceDescription: job.serviceDescription,
      specialInstructions: job.specialInstructions,
      assignedEmployeeId: job.assignedEmployeeId,
      assignedEmployeeName: job.assignedEmployeeName,
      status: job.status.toLowerCase(), // Convertesc enum la lowercase
      priority: job.priority.toLowerCase(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      acceptedAt: job.acceptedAt?.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      completionData: job.completionData as any
    }))

    return NextResponse.json({
      success: true,
      data: transformedJobs,
      timestamp: new Date().toISOString(),
      version: Date.now()
    })

  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch jobs'
      },
      { status: 500 }
    )
  }
}

// POST /api/jobs - Creează un job nou  
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      clientName,
      clientPhone,
      address,
      serviceName,
      serviceDescription,
      specialInstructions,
      assignedEmployeeId,
      assignedEmployeeName,
      status = 'assigned',
      priority = 'normal',
      createdById = 'admin1' // În realitate ar veni din sesiunea de autentificare
    } = body

    // Validare de bază
    if (!clientName || !clientPhone || !address || !serviceName || !assignedEmployeeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      )
    }

    const job = await prisma.job.create({
      data: {
        clientName,
        clientPhone,
        address,
        serviceName,
        serviceDescription,
        specialInstructions,
        assignedEmployeeId,
        assignedEmployeeName,
        status: status.toUpperCase() as any,
        priority: priority.toUpperCase() as any,
        createdById
      },
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
    })

    // Transform pentru compatibilitate
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
    }

    // Creează notificare pentru lucrător
    await prisma.notification.create({
      data: {
        type: 'JOB_ASSIGNED',
        title: '🆕 Job Nou Assignat',
        message: `Ați primit o nouă lucrare: ${job.serviceName} pentru ${job.clientName}`,
        jobId: job.id,
        workerId: job.assignedEmployeeId,
        urgent: job.priority === 'URGENT'
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedJob,
      timestamp: new Date().toISOString(),
      version: Date.now()
    })

  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create job'
      },
      { status: 500 }
    )
  }
}