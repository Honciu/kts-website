import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// GET - Get all partners
export async function GET(request: NextRequest) {
  try {
    console.log('👥 Partners API: Fetching all partners');
    
    const partners = await prisma.businessPartner.findMany({
      include: {
        weeklyCosts: {
          orderBy: {
            weekStart: 'desc'
          },
          take: 10 // Last 10 weeks
        }
      }
    });
    
    console.log(`👥 Found ${partners.length} partners`);
    
    return NextResponse.json({
      success: true,
      data: partners
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