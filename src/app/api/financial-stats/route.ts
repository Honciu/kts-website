import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient(); // TODO: Re-enable after database migration

// GET - Retrieve financial stats for a specific week
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    
    if (!weekStart) {
      return NextResponse.json({
        success: false,
        error: 'weekStart parameter is required'
      }, { status: 400 });
    }
    
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    console.log(`📊 Financial Stats API (MOCK): Fetching for week ${weekStartDate.toISOString()} to ${weekEndDate.toISOString()}`);
    
    // TODO: Replace with real database queries after migration
    // For now, return mock data to prevent 500 errors
    const mockStats = {
      id: 'mock_' + weekStart,
      weekStart: weekStartDate.toISOString(),
      weekEnd: weekEndDate.toISOString(),
      totalRevenue: 2400,
      cashRevenue: 1200,
      cardRevenue: 800,
      bankTransferRevenue: 400,
      tvaAmount: 456,
      cardPaymentDetails: {
        'KTS': 400,
        'Urgente_Deblocari': 250,
        'Lacatusul_Priceput': 150
      },
      bankTransferDetails: {
        'KTS': 200,
        'Urgente_Deblocari': 150,
        'Lacatusul_Priceput': 50
      },
      totalSalaries: 720,
      totalMaterials: 360,
      totalAdsSpend: 300,
      cashToCollect: 480,
      netProfit: 1020,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('📊 Returning mock financial stats data');
    
    return NextResponse.json({
      success: true,
      data: mockStats
    });
    
  } catch (error) {
    console.error('❌ Financial Stats API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// TODO: Re-enable this function after database migration
// async function calculateWeeklyStats(weekStart: Date, weekEnd: Date) {
//   console.log('🧮 Calculating weekly financial stats...');
//   ...
// }
