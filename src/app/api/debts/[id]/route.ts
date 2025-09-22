import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/debts/[id] - Mark debt as paid/unpaid or update debt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('✏️ API: Updating debt:', id, body);

    const { isPaid, amount, description } = body;

    // For now, return mock response since we don't have Debt model
    // This should be updated when Debt model is added to Prisma schema
    
    /* 
    When Debt model is added to schema, uncomment this:
    
    // Check if debt exists
    const existingDebt = await prisma.debt.findUnique({
      where: { id }
    });

    if (!existingDebt) {
      return NextResponse.json({
        success: false,
        error: 'Datoria nu a fost găsită'
      }, { status: 404 });
    }

    // Update debt
    const updateData: any = {};
    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      updateData.paidAt = isPaid ? new Date() : null;
    }
    if (amount !== undefined) {
      updateData.amount = parseFloat(amount);
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    const updatedDebt = await prisma.debt.update({
      where: { id },
      data: updateData
    });

    console.log('✅ API: Debt updated successfully:', updatedDebt.id);

    return NextResponse.json({
      success: true,
      data: updatedDebt,
      message: 'Datoria a fost actualizată cu succes'
    });
    */

    // Mock response for now
    const mockUpdatedDebt = {
      id,
      employeeId: 'mock_employee_id',
      amount: amount || 100,
      description: description || 'Mock debt',
      isPaid: isPaid !== undefined ? isPaid : false,
      createdAt: new Date().toISOString(),
      paidAt: isPaid ? new Date().toISOString() : null
    };

    console.log('✅ API: Mock debt updated successfully:', id);

    return NextResponse.json({
      success: true,
      data: mockUpdatedDebt,
      message: 'Datoria a fost actualizată cu succes'
    });

  } catch (error) {
    console.error('❌ API Error updating debt:', error);
    return NextResponse.json({
      success: false,
      error: 'Eroare la actualizarea datoriei'
    }, { status: 500 });
  }
}

// DELETE /api/debts/[id] - Delete debt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ API: Deleting debt:', id);

    // For now, return mock response since we don't have Debt model
    // This should be updated when Debt model is added to Prisma schema
    
    /* 
    When Debt model is added to schema, uncomment this:
    
    // Check if debt exists
    const existingDebt = await prisma.debt.findUnique({
      where: { id }
    });

    if (!existingDebt) {
      return NextResponse.json({
        success: false,
        error: 'Datoria nu a fost găsită'
      }, { status: 404 });
    }

    // Delete debt
    await prisma.debt.delete({
      where: { id }
    });

    console.log('✅ API: Debt deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Datoria a fost ștearsă cu succes'
    });
    */

    // Mock response for now
    console.log('✅ API: Mock debt deleted successfully:', id);

    return NextResponse.json({
      success: true,
      message: 'Datoria a fost ștearsă cu succes'
    });

  } catch (error) {
    console.error('❌ API Error deleting debt:', error);
    return NextResponse.json({
      success: false,
      error: 'Eroare la ștergerea datoriei'
    }, { status: 500 });
  }
}