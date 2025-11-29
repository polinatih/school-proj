// src/app/api/classes/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/classes
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const gradeId = searchParams.get('gradeId')

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const }
    }

    if (gradeId) {
      where.gradeId = parseInt(gradeId)
    }

    const classes = await prisma.class.findMany({
      where,
      skip,
      take: limit,
      include: {
        grade: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        _count: {
          select: {
            students: true,
            lessons: true,
            events: true,
            announcements: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const total = await prisma.class.count({ where })

    return NextResponse.json({
      success: true,
      data: classes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching classes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch classes',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/classes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, capacity, gradeId } = body

    if (!name || !capacity || !gradeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['name', 'capacity', 'gradeId'],
        },
        { status: 400 }
      )
    }

    // Проверка уникальности имени класса
    const existingClass = await prisma.class.findUnique({
      where: { name },
    })

    if (existingClass) {
      return NextResponse.json(
        {
          success: false,
          error: 'Class with this name already exists',
        },
        { status: 409 }
      )
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        capacity: parseInt(capacity),
        gradeId: parseInt(gradeId),
        ...(body.supervisorId && { supervisorId: body.supervisorId }),
      },
      include: {
        grade: true,
        supervisor: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Class created successfully',
        data: newClass,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating class:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}