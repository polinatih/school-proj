// src/app/api/results/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/results/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const result = await prisma.result.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            class: true,
            grade: true,
          },
        },
        exam: {
          include: {
            lesson: {
              include: {
                subject: true,
                class: true,
                teacher: true,
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
                teacher: true,
              },
            },
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Result not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('❌ Error fetching result:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch result',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/results/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingResult = await prisma.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json(
        { success: false, error: 'Result not found' },
        { status: 404 }
      )
    }

    // Валидация score
    if (body.score !== undefined && (body.score < 0 || body.score > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Score must be between 0 and 100',
        },
        { status: 400 }
      )
    }

    const updatedResult = await prisma.result.update({
      where: { id },
      data: {
        ...(body.score !== undefined && { score: parseInt(body.score) }),
        ...(body.examId && { examId: parseInt(body.examId) }),
        ...(body.assignmentId && { assignmentId: parseInt(body.assignmentId) }),
        ...(body.studentId && { studentId: body.studentId }),
      },
      include: {
        student: true,
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

    return NextResponse.json({
      success: true,
      message: 'Result updated successfully',
      data: updatedResult,
    })
  } catch (error) {
    console.error('❌ Error updating result:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update result',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/results/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingResult = await prisma.result.findUnique({
      where: { id },
    })

    if (!existingResult) {
      return NextResponse.json(
        { success: false, error: 'Result not found' },
        { status: 404 }
      )
    }

    await prisma.result.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting result:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete result',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}