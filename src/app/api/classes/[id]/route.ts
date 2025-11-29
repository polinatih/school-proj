// src/app/api/classes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/classes/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        grade: true,
        supervisor: true,
        students: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                surname: true,
                phone: true,
              },
            },
          },
        },
        lessons: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true,
                surname: true,
              },
            },
          },
        },
        events: true,
        announcements: true,
      },
    })

    if (!classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: classData })
  } catch (error) {
    console.error('❌ Error fetching class:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/classes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.capacity && { capacity: parseInt(body.capacity) }),
        ...(body.gradeId && { gradeId: parseInt(body.gradeId) }),
        ...(body.supervisorId !== undefined && { 
          supervisorId: body.supervisorId || null 
        }),
      },
      include: {
        grade: true,
        supervisor: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass,
    })
  } catch (error) {
    console.error('❌ Error updating class:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/classes/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            lessons: true,
          },
        },
      },
    })

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    if (existingClass._count.students > 0 || existingClass._count.lessons > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete class with existing students or lessons',
          details: {
            students: existingClass._count.students,
            lessons: existingClass._count.lessons,
          },
        },
        { status: 409 }
      )
    }

    await prisma.class.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting class:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete class',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}