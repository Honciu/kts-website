import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Variabilă globală pentru versiunea
let currentVersion = Date.now()

// GET /api/sync/status - Returnează versiunea curentă pentru polling
export async function GET() {
  try {
    // În realitate, versiunea ar putea fi bazată pe ultimul timestamp de modificare din DB
    const latestJob = await prisma.job.findFirst({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    })

    // Folosim timestamp-ul celei mai recente modificări ca versiune
    const version = latestJob ? latestJob.updatedAt.getTime() : currentVersion

    return NextResponse.json({
      success: true,
      version,
      timestamp: new Date().toISOString(),
      server: 'KTS API v1.0'
    })

  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      {
        success: false,
        version: 0,
        error: 'Failed to check sync status'
      },
      { status: 500 }
    )
  }
}

// POST /api/sync/status - Force update version (pentru testing)
export async function POST() {
  currentVersion = Date.now()
  
  return NextResponse.json({
    success: true,
    version: currentVersion,
    message: 'Version updated'
  })
}