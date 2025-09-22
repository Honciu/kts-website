import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET /api/employees - Obține toți angajații
export async function GET() {
  try {
    const employees = await prisma.user.findMany({
      where: {
        type: 'WORKER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculate basic statistics for each employee
    const employeesWithStats = employees.map(employee => {
      return {
        ...employee,
        totalDebt: 0, // Will be calculated when debt system is implemented
        unpaidDebts: 0,
        completedJobsLast30Days: 0,
        totalRevenueLast30Days: 0
      }
    })

    return NextResponse.json({
      success: true,
      data: employeesWithStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

// POST /api/employees - Creează un angajat nou
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        type: 'WORKER',
        isActive: true
      }
    })

    // Remove password from response
    const { password: _, ...employeeResponse } = newEmployee

    return NextResponse.json({
      success: true,
      data: employeeResponse,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}