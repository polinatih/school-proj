
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/lessons/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        subject: true,
        class: {
          include: {
            grade: true,
          },
        },
        teacher: true,
        exams: true,
        assignments: true,
        attendances: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 20,
        },
      },
    })

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: lesson })
  } catch (error) {
    console.error('❌ Error fetching lesson:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lesson',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/lessons/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
    })

    if (!existingLesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.day && { day: body.day.toUpperCase() }),
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.subjectId && { subjectId: parseInt(body.subjectId) }),
        ...(body.classId && { classId: parseInt(body.classId) }),
        ...(body.teacherId && { teacherId: body.teacherId }),
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Lesson updated successfully',
      data: updatedLesson,
    })
  } catch (error) {
    console.error('❌ Error updating lesson:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update lesson',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/lessons/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            exams: true,
            assignments: true,
            attendances: true,
          },
        },
      },
    })

    if (!existingLesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      )
    }

    if (
      existingLesson._count.exams > 0 ||
      existingLesson._count.assignments > 0 ||
      existingLesson._count.attendances > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete lesson with existing exams, assignments or attendance records',
          details: {
            exams: existingLesson._count.exams,
            assignments: existingLesson._count.assignments,
            attendances: existingLesson._count.attendances,
          },
        },
        { status: 409 }
      )
    }

    await prisma.lesson.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting lesson:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete lesson',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}