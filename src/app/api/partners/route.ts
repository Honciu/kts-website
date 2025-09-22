import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient(); // TODO: Re-enable after database migration

// GET - Get all partners
export async function GET(request: NextRequest) {
  try {
    console.log('👥 Partners API (MOCK): Fetching all partners');
    
    // TODO: Replace with real database queries after migration
    // For now, return mock data to prevent 500 errors
    const mockPartners = [
      {
        id: 'partner_1',
        name: 'Robert',
        email: 'robert@kts.ro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        weeklyCosts: [
          {
            id: 'cost_1_1',
            partnerId: 'partner_1',
            weekStart: new Date().toISOString(),
            weekEnd: new Date().toISOString(),
            dailyAdsCosts: [50, 45, 60, 55, 70, 40, 30],
            totalWeeklyCost: 350,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'partner_2',
        name: 'Alex',
        email: 'alex@kts.ro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        weeklyCosts: [
          {
            id: 'cost_2_1',
            partnerId: 'partner_2',
            weekStart: new Date().toISOString(),
            weekEnd: new Date().toISOString(),
            dailyAdsCosts: [40, 35, 50, 45, 60, 30, 20],
            totalWeeklyCost: 280,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'partner_3',
        name: 'Maria',
        email: 'maria@kts.ro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        weeklyCosts: [
          {
            id: 'cost_3_1',
            partnerId: 'partner_3',
            weekStart: new Date().toISOString(),
            weekEnd: new Date().toISOString(),
            dailyAdsCosts: [30, 25, 40, 35, 50, 20, 15],
            totalWeeklyCost: 215,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ];
    
    console.log(`👥 Returning ${mockPartners.length} mock partners`);
    
    return NextResponse.json({
      success: true,
      data: mockPartners
    });
    
  } catch (error) {
    console.error('❌ Partners API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create a new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;
    
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Partner name is required'
      }, { status: 400 });
    }
    
    console.log(`👥 Partners API: Creating new partner - ${name}`);
    
    const partner = await prisma.businessPartner.create({
      data: {
        name,
        email
      }
    });
    
    console.log(`✅ Partner created with ID: ${partner.id}`);
    
    return NextResponse.json({
      success: true,
      data: partner
    });
    
  } catch (error) {
    console.error('❌ Partners API Error:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({
        success: false,
        error: 'Partner with this name already exists'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}