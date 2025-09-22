import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get partner weekly costs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const partnerId = id;
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');
    
    console.log(`💰 Partner Costs API: Fetching costs for partner ${partnerId}`);
    
    if (weekStart) {
      // Get specific week costs
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      let costs = await prisma.partnerWeeklyCosts.findUnique({
        where: {
          partnerId_weekStart: {
            partnerId: partnerId,
            weekStart: weekStartDate
          }
        }
      });
      
      if (!costs) {
        // Create empty costs record for the week
        costs = await prisma.partnerWeeklyCosts.create({
          data: {
            partnerId: partnerId,
            weekStart: weekStartDate,
            weekEnd: weekEndDate,
            dailyCosts: [0, 0, 0, 0, 0, 0, 0],
            totalCosts: 0
          }
        });
        
        console.log(`💰 Created empty costs record for week ${weekStart}`);
      }
      
      return NextResponse.json({
        success: true,
        data: costs
      });
      
    } else {
      // Get all weeks costs for partner
      const allCosts = await prisma.partnerWeeklyCosts.findMany({
        where: {
          partnerId: partnerId
        },
        orderBy: {
          weekStart: 'desc'
        }
      });
      
      return NextResponse.json({
        success: true,
        data: allCosts
      });
    }
    
  } catch (error) {
    console.error('❌ Partner Costs API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create or update partner weekly costs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partnerId = id;
    const body = await request.json();
    const { weekStart, dailyCosts, notes } = body;
    
    if (!weekStart || !Array.isArray(dailyCosts) || dailyCosts.length !== 7) {
      return NextResponse.json({
        success: false,
        error: 'weekStart and dailyCosts (array of 7 numbers) are required'
      }, { status: 400 });
    }
    
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const totalCosts = dailyCosts.reduce((sum, cost) => sum + (cost || 0), 0);
    
    console.log(`💰 Partner Costs API: Updating costs for partner ${partnerId}, week ${weekStart}`);
    console.log(`  Daily costs: ${dailyCosts.join(', ')} RON`);
    console.log(`  Total: ${totalCosts} RON`);
    
    const costs = await prisma.partnerWeeklyCosts.upsert({
      where: {
        partnerId_weekStart: {
          partnerId: partnerId,
          weekStart: weekStartDate
        }
      },
      update: {
        dailyCosts: dailyCosts,
        totalCosts: totalCosts,
        notes: notes
      },
      create: {
        partnerId: partnerId,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        dailyCosts: dailyCosts,
        totalCosts: totalCosts,
        notes: notes
      }
    });
    
    console.log(`✅ Partner costs updated successfully`);
    
    return NextResponse.json({
      success: true,
      data: costs
    });
    
  } catch (error) {
    console.error('❌ Partner Costs API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}