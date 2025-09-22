import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    console.log(`📊 Financial Stats API: Fetching for week ${weekStartDate.toISOString()} to ${weekEndDate.toISOString()}`);
    
    // Try to get existing stats
    let stats = await prisma.weeklyFinancialStats.findUnique({
      where: {
        weekStart: weekStartDate
      }
    });
    
    if (!stats) {
      console.log('📊 No existing stats found, calculating from jobs data...');
      
      // Calculate stats from jobs if not exists
      const calculatedStats = await calculateWeeklyStats(weekStartDate, weekEndDate);
      
      // Create new stats record
      stats = await prisma.weeklyFinancialStats.create({
        data: {
          weekStart: weekStartDate,
          weekEnd: weekEndDate,
          ...calculatedStats
        }
      });
      
      console.log('📊 Created new financial stats record');
    } else {
      console.log('📊 Found existing stats, refreshing calculations...');
      
      // Update existing stats with fresh calculations
      const calculatedStats = await calculateWeeklyStats(weekStartDate, weekEndDate);
      
      stats = await prisma.weeklyFinancialStats.update({
        where: { id: stats.id },
        data: calculatedStats
      });
      
      console.log('📊 Updated existing financial stats');
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Financial Stats API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

async function calculateWeeklyStats(weekStart: Date, weekEnd: Date) {
  console.log('🧮 Calculating weekly financial stats...');
  
  // Get all completed jobs for the week using proper enum values and robust date filtering
  const weeklyJobs = await prisma.job.findMany({
    where: {
      status: {
        in: ['COMPLETED', 'PENDING_APPROVAL']
      },
      AND: [
        {
          OR: [
            { completedAt: { gte: weekStart, lte: weekEnd } },
            { 
              completedAt: null,
              updatedAt: { gte: weekStart, lte: weekEnd },
              status: { in: ['COMPLETED', 'PENDING_APPROVAL'] }
            }
          ]
        }
      ]
    },
    include: {
      assignedWorker: true
    }
  });
  
  // Also get all completed jobs regardless of week to ensure we find data
  const allCompletedJobs = await prisma.job.findMany({
    where: {
      status: {
        in: ['COMPLETED', 'PENDING_APPROVAL']
      }
    },
    include: {
      assignedWorker: true
    }
  });
  
  console.log(`📋 Query executed for date range: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
  console.log(`📋 Total completed jobs in database: ${allCompletedJobs.length}`);
  console.log(`📋 Jobs found in selected week: ${weeklyJobs.length}`);
  console.log(`📋 Jobs with COMPLETED status in week:`, weeklyJobs.filter(j => j.status === 'COMPLETED').length);
  console.log(`📋 Jobs with PENDING_APPROVAL status in week:`, weeklyJobs.filter(j => j.status === 'PENDING_APPROVAL').length);
  
  // Debug: List all completed jobs with their dates
  console.log('📅 All completed jobs in database:');
  allCompletedJobs.forEach(job => {
    console.log(`  - Job ${job.id}: Status=${job.status}, CompletedAt=${job.completedAt}, UpdatedAt=${job.updatedAt}`);
  });
  
  console.log(`📋 Found ${weeklyJobs.length} completed jobs for the week`);
  
  let totalRevenue = 0;
  let cashRevenue = 0;
  let cardRevenue = 0;
  let bankTransferRevenue = 0;
  let tvaAmount = 0;
  let totalSalaries = 0;
  let cashToCollect = 0;
  
  const cardPaymentDetails: {[key: string]: number} = {
    'KTS': 0,
    'Urgente_Deblocari': 0,
    'Lacatusul_Priceput': 0
  };
  
  const bankTransferDetails: {[key: string]: number} = {
    'KTS': 0,
    'Urgente_Deblocari': 0,
    'Lacatusul_Priceput': 0
  };
  
  weeklyJobs.forEach(job => {
    const completionData = job.completionData as any;
    if (!completionData) return;
    
    const jobTotal = completionData.totalAmount || 0;
    const jobTva = completionData.tvaAmount || 0;
    const workerCommission = completionData.workerCommission || 0;
    const paymentMethod = completionData.paymentMethod || 'cash';
    const bankAccount = completionData.bankAccount;
    
    totalRevenue += jobTotal;
    tvaAmount += jobTva;
    totalSalaries += workerCommission;
    
    if (paymentMethod === 'cash') {
      cashRevenue += jobTotal;
      // Only cash payments need to be collected from workers
      cashToCollect += Math.max(0, jobTotal - workerCommission);
    } else if (paymentMethod === 'card') {
      cardRevenue += jobTotal;
      if (bankAccount && cardPaymentDetails.hasOwnProperty(bankAccount)) {
        cardPaymentDetails[bankAccount] += jobTotal;
      }
    } else if (paymentMethod === 'bank_transfer') {
      bankTransferRevenue += jobTotal;
      if (bankAccount && bankTransferDetails.hasOwnProperty(bankAccount)) {
        bankTransferDetails[bankAccount] += jobTotal;
      }
    }
  });
  
  // Calculate material costs (estimated 15% of revenue)
  const totalMaterials = Math.round(totalRevenue * 0.15);
  
  // Get ads spend from local storage simulation
  // In production, this would come from database
  let totalAdsSpend = 0;
  
  console.log('💰 Weekly Financial Summary:');
  console.log(`  - Total Revenue: ${totalRevenue} RON`);
  console.log(`  - Cash: ${cashRevenue} RON`);
  console.log(`  - Card: ${cardRevenue} RON`);
  console.log(`  - Bank Transfer: ${bankTransferRevenue} RON`);
  console.log(`  - TVA: ${tvaAmount} RON`);
  console.log(`  - Total Salaries: ${totalSalaries} RON`);
  console.log(`  - Cash to Collect: ${cashToCollect} RON`);
  console.log(`  - Materials (15%): ${totalMaterials} RON`);
  
  const netProfit = totalRevenue - totalSalaries - totalMaterials - totalAdsSpend;
  
  return {
    totalRevenue,
    cashRevenue,
    cardRevenue,
    bankTransferRevenue,
    tvaAmount,
    cardPaymentDetails: cardPaymentDetails,
    bankTransferDetails: bankTransferDetails,
    totalSalaries,
    totalMaterials,
    totalAdsSpend,
    cashToCollect,
    netProfit
  };
}