import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            subject: true,
            class: true,
            teacher: true,
          },
        },
        results: {
          include: {
            student: {
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

    if (!exam) {
      return NextResponse.json(
        { success: false, error: 'Exam not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: exam })
  } catch (error) {
    console.error('❌ Error fetching exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
        ...(body.lessonId && { lessonId: parseInt(body.lessonId) }),
      },
      include: {
        lesson: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Exam updated successfully',
      data: exam,
    })
  } catch (error) {
    console.error('❌ Error updating exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    await prisma.exam.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting exam:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete exam' },
      { status: 500 }
    )
  }
}