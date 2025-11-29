
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lessonId = searchParams.get('lessonId')

    const where = lessonId ? { lessonId: parseInt(lessonId) } : {}

    const exams = await prisma.exam.findMany({
      where,
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
        startTime: 'desc',
      },
    })

    return NextResponse.json({ success: true, data: exams })
  } catch (error) {
    console.error('❌ Error fetching exams:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, startTime, endTime, lessonId } = body

    if (!title || !startTime || !endTime || !lessonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['title', 'startTime', 'endTime', 'lessonId'],
        },
        { status: 400 }
      )
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        lessonId: parseInt(lessonId),
      },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
    })

    return NextResponse.json(
      { success: true, message: 'Exam created successfully', data: exam },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}