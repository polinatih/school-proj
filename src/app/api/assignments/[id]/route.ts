// src/app/api/assignments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/assignments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            subject: true,
            class: {
              include: {
                grade: true,
              },
            },
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
                class: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            score: 'desc',
          },
        },
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    console.error('❌ Error fetching assignment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/assignments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Валидация дат (если обновляются обе)
    if (body.startDate && body.dueDate) {
      const start = new Date(body.startDate)
      const due = new Date(body.dueDate)

      if (due <= start) {
        return NextResponse.json(
          {
            success: false,
            error: 'Due date must be after start date',
          },
          { status: 400 }
        )
      }
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
        ...(body.lessonId && { lessonId: parseInt(body.lessonId) }),
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

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: updatedAssignment,
    })
  } catch (error) {
    console.error('❌ Error updating assignment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/assignments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            results: true,
          },
        },
      },
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Опционально: предупреждение, если есть результаты
    if (existingAssignment._count.results > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete assignment with existing results',
          details: {
            results: existingAssignment._count.results,
          },
        },
        { status: 409 }
      )
    }

    await prisma.assignment.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting assignment:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete assignment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}