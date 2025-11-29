// src/app/api/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/assignments
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const lessonId = searchParams.get('lessonId')
    const classId = searchParams.get('classId')

    const skip = (page - 1) * limit

    const where: any = {}

    if (lessonId) {
      where.lessonId = parseInt(lessonId)
    }

    if (classId) {
      where.lesson = {
        classId: parseInt(classId),
      }
    }

    const assignments = await prisma.assignment.findMany({
      where,
      skip,
      take: limit,
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: {
        dueDate: 'desc',
      },
    })

    const total = await prisma.assignment.count({ where })

    return NextResponse.json({
      success: true,
      data: assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching assignments:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assignments',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/assignments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { title, startDate, dueDate, lessonId } = body

    if (!title || !startDate || !dueDate || !lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['title', 'startDate', 'dueDate', 'lessonId'],
        },
        { status: 400 }
      )
    }

    // Проверка, что dueDate позже startDate
    const start = new Date(startDate)
    const due = new Date(dueDate)

    if (due <= start) {
      return NextResponse.json(
        {
          success: false,
          error: 'Due date must be after start date',
        },
        { status: 400 }
      )
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        startDate: start,
        dueDate: due,
        lessonId: parseInt(lessonId),
      },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Assignment created successfully',
        data: assignment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating assignment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}