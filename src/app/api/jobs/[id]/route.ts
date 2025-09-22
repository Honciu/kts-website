import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    const job = await prisma.job.findUnique({
      where: { id: resolvedParams.id },
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
          take: 10
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

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
      updatedAt: job.updatedAt.toISOString(),
      acceptedAt: job.acceptedAt?.toISOString(),
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      completionData: job.completionData as any
    }

    return NextResponse.json({
      success: true,
      data: transformedJob,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
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
      status,
      priority,
      acceptedAt,
      startedAt,
      completedAt,
      completionData
    } = body

    // Verifică că job-ul există
    const existingJob = await prisma.job.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingJob) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Actualizează job-ul
    const updatedJob = await prisma.job.update({
      where: { id: resolvedParams.id },
      data: {
        ...(clientName && { clientName }),
        ...(clientPhone && { clientPhone }),
        ...(address && { address }),
        ...(serviceName && { serviceName }),
        ...(serviceDescription !== undefined && { serviceDescription }),
        ...(specialInstructions !== undefined && { specialInstructions }),
        ...(assignedEmployeeId && { assignedEmployeeId }),
        ...(assignedEmployeeName && { assignedEmployeeName }),
        ...(status && { status: status.toUpperCase() as any }),
        ...(priority && { priority: priority.toUpperCase() as any }),
        ...(acceptedAt && { acceptedAt: new Date(acceptedAt) }),
        ...(startedAt && { startedAt: new Date(startedAt) }),
        ...(completedAt && { completedAt: new Date(completedAt) }),
        ...(completionData !== undefined && { completionData }),
        updatedAt: new Date()
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

    // Creează job update pentru tracking
    await prisma.jobUpdate.create({
      data: {
        jobId: resolvedParams.id,
        status: updatedJob.status,
        workerId: assignedEmployeeId || updatedJob.assignedEmployeeId,
        workerName: assignedEmployeeName || updatedJob.assignedEmployeeName,
        data: {
          action: 'job_updated',
          changes: body
        }
      }
    })

    // Transform pentru frontend
    const transformedJob = {
      id: updatedJob.id,
      clientName: updatedJob.clientName,
      clientPhone: updatedJob.clientPhone,
      address: updatedJob.address,
      serviceName: updatedJob.serviceName,
      serviceDescription: updatedJob.serviceDescription,
      specialInstructions: updatedJob.specialInstructions,
      assignedEmployeeId: updatedJob.assignedEmployeeId,
      assignedEmployeeName: updatedJob.assignedEmployeeName,
      status: updatedJob.status.toLowerCase(),
      priority: updatedJob.priority.toLowerCase(),
      createdAt: updatedJob.createdAt.toISOString(),
      updatedAt: updatedJob.updatedAt.toISOString(),
      acceptedAt: updatedJob.acceptedAt?.toISOString(),
      startedAt: updatedJob.startedAt?.toISOString(),
      completedAt: updatedJob.completedAt?.toISOString(),
      completionData: updatedJob.completionData as any
    }

    console.log(`✅ Job ${resolvedParams.id} updated successfully`)

    return NextResponse.json({
      success: true,
      data: transformedJob,
      timestamp: new Date().toISOString(),
      version: Date.now()
    })

  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // PATCH face același lucru ca PUT pentru simplitate
  return PUT(request, { params })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  try {
    // Verifică că job-ul există
    const existingJob = await prisma.job.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!existingJob) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Şterge job updates şi notifications related
    await prisma.jobUpdate.deleteMany({
      where: { jobId: resolvedParams.id }
    })

    await prisma.notification.deleteMany({
      where: { jobId: resolvedParams.id }
    })

    // Şterge job-ul
    await prisma.job.delete({
      where: { id: resolvedParams.id }
    })

    console.log(`✅ Job ${resolvedParams.id} deleted successfully`)

    return NextResponse.json({
      success: true,
      data: { id: resolvedParams.id },
      timestamp: new Date().toISOString(),
      version: Date.now()
    })

  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}