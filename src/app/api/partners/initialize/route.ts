import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Initialize default partners
export async function POST() {
  try {
    console.log('🚀 Partners Initialize API: Setting up default partners');
    
    const defaultPartners = [
      { name: 'Robert', email: 'robert@kts.ro' },
      { name: 'Arslan', email: 'arslan@kts.ro' },
      { name: 'Norbert', email: 'norbert@kts.ro' }
    ];
    
    const createdPartners = [];
    
    for (const partnerData of defaultPartners) {
      try {
        // Check if partner already exists
        const existingPartner = await prisma.businessPartner.findUnique({
          where: { name: partnerData.name }
        });
        
        if (existingPartner) {
          console.log(`👥 Partner ${partnerData.name} already exists, skipping...`);
          createdPartners.push(existingPartner);
          continue;
        }
        
        // Create new partner
        const partner = await prisma.businessPartner.create({
          data: partnerData
        });
        
        console.log(`✅ Created partner: ${partner.name} (ID: ${partner.id})`);
        createdPartners.push(partner);
        
      } catch (error) {
        console.error(`❌ Error creating partner ${partnerData.name}:`, error);
      }
    }
    
    console.log(`🎉 Partners initialization completed. Created/found ${createdPartners.length} partners`);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Partners initialized successfully',
        partners: createdPartners
      }
    });
    
  } catch (error) {
    console.error('❌ Partners Initialize API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}