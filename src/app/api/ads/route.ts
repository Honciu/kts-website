import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/ads - Obține datele ADS pentru o săptămână
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const weekStart = searchParams.get('weekStart')
    
    if (!weekStart) {
      return NextResponse.json(
        {
          success: false,
          error: 'weekStart parameter is required'
        },
        { status: 400 }
      )
    }

    console.log('📊 ADS API: Loading data for week:', weekStart);

    // Încarcă toate costurile ADS pentru săptămâna specificată
    const adsCosts = await prisma.weeklyAdsCosts.findMany({
      where: {
        weekStart: new Date(weekStart)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Încarcă joburile pentru săptămâna specificată pentru calculul veniturilor
    const weekStartDate = new Date(weekStart)
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000)
    
    const jobs = await prisma.job.findMany({
      where: {
        createdAt: {
          gte: weekStartDate,
          lte: weekEndDate
        },
        status: 'COMPLETED'
      },
      include: {
        assignedWorker: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log('📊 ADS API: Found', adsCosts.length, 'ads costs and', jobs.length, 'jobs');

    return NextResponse.json({
      success: true,
      data: {
        adsCosts,
        jobs
      },
      weekStart,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching ads data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ads data'
      },
      { status: 500 }
    )
  }
}

// POST /api/ads - Salvează/actualizează costurile ADS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📅 POST /api/ads - Received data:', JSON.stringify(body, null, 2));
    
    const {
      userId,
      weekStart,
      weekEnd,
      dailyGoogleAds, // Array de 7 valori pentru zilele săptămânii
      weeklySalaries,
      weeklyMaterials
    } = body

    // Validare de bază
    if (!userId || !weekStart || !dailyGoogleAds || dailyGoogleAds.length !== 7) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, weekStart, dailyGoogleAds (7 days)'
        },
        { status: 400 }
      )
    }

    const weekStartDate = new Date(weekStart)
    const totalGoogleAds = dailyGoogleAds.reduce((sum: number, daily: number) => sum + (daily || 0), 0)

    // Upsert (insert sau update) costurile pentru săptămâna specificată
    const adsCosts = await prisma.weeklyAdsCosts.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart: weekStartDate
        }
      },
      update: {
        weekEnd: new Date(weekEnd),
        dailyGoogleAds,
        totalGoogleAds,
        weeklySalaries: weeklySalaries || 0,
        weeklyMaterials: weeklyMaterials || 0,
        updatedAt: new Date()
      },
      create: {
        userId,
        weekStart: weekStartDate,
        weekEnd: new Date(weekEnd),
        dailyGoogleAds,
        totalGoogleAds,
        weeklySalaries: weeklySalaries || 0,
        weeklyMaterials: weeklyMaterials || 0
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    console.log('✅ ADS costs saved successfully:', {
      userId,
      weekStart,
      totalGoogleAds,
      weeklySalaries,
      weeklyMaterials
    });

    return NextResponse.json({
      success: true,
      data: adsCosts,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error saving ads data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save ads data'
      },
      { status: 500 }
    )
  }
}