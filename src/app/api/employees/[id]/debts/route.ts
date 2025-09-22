import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/employees/[id]/debts - Get debts for an employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('💳 API: Getting debts for employee:', id);

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: {
        id,
        type: 'WORKER'
      }
    });

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Angajatul nu a fost găsit'
      }, { status: 404 });
    }

    // For now, return empty array since we don't have Debt model in schema
    // This should be updated when Debt model is added to Prisma schema
    const debts = [];

    /* 
    When Debt model is added to schema, uncomment this:
    
    const debts = await prisma.debt.findMany({
      where: {
        employeeId: id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    */

    console.log(`✅ API: Found ${debts.length} debts for employee ${employee.name}`);

    return NextResponse.json({
      success: true,
      data: debts
    });

  } catch (error) {
    console.error('❌ API Error getting employee debts:', error);
    return NextResponse.json({
      success: false,
      error: 'Eroare la încărcarea datoriilor'
    }, { status: 500 });
  }
}

// POST /api/employees/[id]/debts - Create new debt for employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('➕ API: Creating debt for employee:', id, body);

    const { amount, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Suma trebuie să fie mai mare decât 0'
      }, { status: 400 });
    }

    if (!description || !description.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Descrierea este obligatorie'
      }, { status: 400 });
    }

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: {
        id,
        type: 'WORKER'
      }
    });

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Angajatul nu a fost găsit'
      }, { status: 404 });
    }

    // For now, return a mock debt since we don't have Debt model
    // This should be updated when Debt model is added to Prisma schema
    const mockDebt = {
      id: `debt_${Date.now()}`,
      employeeId: id,
      amount: parseFloat(amount),
      description: description.trim(),
      isPaid: false,
      createdAt: new Date().toISOString(),
      paidAt: null
    };

    /*
    When Debt model is added to schema, uncomment this:
    
    const newDebt = await prisma.debt.create({
      data: {
        employeeId: id,
        amount: parseFloat(amount),
        description: description.trim(),
        isPaid: false
      }
    });
    */

    console.log('✅ API: Debt created successfully for employee:', employee.name);

    return NextResponse.json({
      success: true,
      data: mockDebt,
      message: 'Datoria a fost adăugată cu succes'
    });

  } catch (error) {
    console.error('❌ API Error creating debt:', error);
    return NextResponse.json({
      success: false,
      error: 'Eroare la crearea datoriei'
    }, { status: 500 });
  }
}