// src/app/api/results/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/results
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const studentId = searchParams.get('studentId')
    const examId = searchParams.get('examId')
    const assignmentId = searchParams.get('assignmentId')

    const skip = (page - 1) * limit

    const where: any = {}

    if (studentId) where.studentId = studentId
    if (examId) where.examId = parseInt(examId)
    if (assignmentId) where.assignmentId = parseInt(assignmentId)

    const results = await prisma.result.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        exam: {
          include: {
            lesson: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    })

    const total = await prisma.result.count({ where })

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching results:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch results',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { score, studentId, examId, assignmentId } = body

    // Валидация обязательных полей
    if (score === undefined || !studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['score', 'studentId', 'examId OR assignmentId'],
        },
        { status: 400 }
      )
    }

    // Должен быть либо examId, либо assignmentId
    if (!examId && !assignmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either examId or assignmentId is required',
        },
        { status: 400 }
      )
    }

    // Валидация score (0-100)
    if (score < 0 || score > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Score must be between 0 and 100',
        },
        { status: 400 }
      )
    }

    // Проверка существования студента
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found',
        },
        { status: 404 }
      )
    }

    const result = await prisma.result.create({
      data: {
        score: parseInt(score),
        studentId,
        ...(examId && { examId: parseInt(examId) }),
        ...(assignmentId && { assignmentId: parseInt(assignmentId) }),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        exam: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Result created successfully',
        data: result,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating result:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create result',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}