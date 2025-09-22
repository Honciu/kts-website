import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/employees/[id] - Dezactivează un angajat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id, type: 'WORKER' }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
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

    return NextResponse.json({
      success: true,
      data: { 
        id: deactivatedEmployee.id, 
        message: 'Employee deactivated successfully' 
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
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
    const { name, email, phone, isActive } = body

    // Check if employee exists
    const employee = await prisma.user.findUnique({
      where: { id, type: 'WORKER' }
    })

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
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
          { success: false, error: 'Email already exists' },
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
        updatedAt: new Date()
      }
    })

    // Remove password from response
    const { password: _, ...employeeResponse } = updatedEmployee

    return NextResponse.json({
      success: true,
      data: employeeResponse,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}