import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/employees/[id] - Dezactivează un angajat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ API: Deleting/deactivating employee:', id)

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id, type: 'WORKER' }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Angajatul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Deactivate instead of hard delete to preserve data integrity
    const deactivatedEmployee = await prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    console.log('✅ API: Employee deactivated successfully:', employee.name)

    return NextResponse.json({
      success: true,
      data: { 
        id: deactivatedEmployee.id, 
        message: 'Angajatul a fost dezactivat cu succes' 
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ API Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare la ștergerea angajatului' },
      { status: 500 }
    )
  }
}

// PUT /api/employees/[id] - Actualizează un angajat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('✏️ API: Updating employee:', id, body)
    
    const { name, email, phone, isActive, salaryPercentage } = body

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id, type: 'WORKER' }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Angajatul nu a fost găsit' },
        { status: 404 }
      )
    }

    // Check if email is being changed and already exists
    if (email && email !== employee.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Un alt utilizator cu acest email există deja' },
          { status: 400 }
        )
      }
    }

    const updatedEmployee = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
        // ...(salaryPercentage !== undefined && { salaryPercentage }), // TODO: Add after migration
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        type: true,
        // salaryPercentage: true, // TODO: Add after migration
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ API: Employee updated successfully:', updatedEmployee.name)

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ API Error updating employee:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Un utilizator cu acest email există deja' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Eroare la actualizarea angajatului' },
      { status: 500 }
    )
  }
}
