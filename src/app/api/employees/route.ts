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
        type: true,
        salaryPercentage: true,
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
    console.log('➕ API: Creating new employee:', body)
    
    const { name, email, phone, password, type, salaryPercentage, isActive } = body

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Numele și email-ul sunt obligatorii' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un utilizator cu acest email există deja' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'temp123', 12)

    const newEmployee = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        type: type || 'WORKER',
        salaryPercentage: salaryPercentage || 30,
        isActive: isActive !== undefined ? isActive : true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        type: true,
        salaryPercentage: true,
        createdAt: true,
        updatedAt: true
      }
    })

    console.log('✅ API: Employee created successfully:', newEmployee.id)

    return NextResponse.json({
      success: true,
      data: newEmployee,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ API Error creating employee:', error)
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Un utilizator cu acest email există deja' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Eroare la crearea angajatului' },
      { status: 500 }
    )
  }
}
