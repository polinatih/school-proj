// src/app/api/lessons/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/lessons
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const classId = searchParams.get('classId')
    const teacherId = searchParams.get('teacherId')
    const subjectId = searchParams.get('subjectId')
    const day = searchParams.get('day')

    const skip = (page - 1) * limit

    const where: any = {}

    if (classId) where.classId = parseInt(classId)
    if (teacherId) where.teacherId = teacherId
    if (subjectId) where.subjectId = parseInt(subjectId)
    if (day) where.day = day.toUpperCase()

    const lessons = await prisma.lesson.findMany({
      where,
      skip,
      take: limit,
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
        _count: {
          select: {
            exams: true,
            assignments: true,
            attendances: true,
          },
        },
      },
      orderBy: [
        { day: 'asc' },
        { startTime: 'asc' },
      ],
    })

    const total = await prisma.lesson.count({ where })

    return NextResponse.json({
      success: true,
      data: lessons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching lessons:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lessons',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/lessons
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, day, startTime, endTime, subjectId, classId, teacherId } = body

    if (!name || !day || !startTime || !endTime || !subjectId || !classId || !teacherId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['name', 'day', 'startTime', 'endTime', 'subjectId', 'classId', 'teacherId'],
        },
        { status: 400 }
      )
    }

    const lesson = await prisma.lesson.create({
      data: {
        name,
        day: day.toUpperCase(),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        subjectId: parseInt(subjectId),
        classId: parseInt(classId),
        teacherId,
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson created successfully',
        data: lesson,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating lesson:', error)
return NextResponse.json(
{
success: false,
error: 'Failed to create lesson',
message: error instanceof Error ? error.message : 'Unknown error',
},
{ status: 500 }
)
}
}