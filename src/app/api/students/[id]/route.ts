// src/app/api/students/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        grade: true,
        parent: true,
        attendances: {
          include: {
            lesson: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        results: {
          include: {
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
          orderBy: {
            id: 'desc',
          },
          take: 10,
        },
      },
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

    return NextResponse.json({
      success: true,
      data: student,
    })
  } catch (error) {
    console.error('❌ Error fetching student:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch student',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/students/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    })

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found',
        },
        { status: 404 }
      )
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...(body.username && { username: body.username }),
        ...(body.name && { name: body.name }),
        ...(body.surname && { surname: body.surname }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.img !== undefined && { img: body.img || null }),
        ...(body.bloodType !== undefined && { bloodType: body.bloodType || null }),
        ...(body.sex && { sex: body.sex }),
        ...(body.birthday && { birthday: new Date(body.birthday) }),
        ...(body.classId && { classId: parseInt(body.classId) }),
        ...(body.gradeId && { gradeId: parseInt(body.gradeId) }),
        ...(body.parentId && { parentId: body.parentId }),
      },
      include: {
        class: true,
        grade: true,
        parent: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
    })
  } catch (error) {
    console.error('❌ Error updating student:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update student',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingStudent = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: true,
            results: true,
          },
        },
      },
    })

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found',
        },
        { status: 404 }
      )
    }

    if (existingStudent._count.attendances > 0 || existingStudent._count.results > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete student with existing records',
          details: {
            attendances: existingStudent._count.attendances,
            results: existingStudent._count.results,
          },
        },
        { status: 409 }
      )
    }

    await prisma.student.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting student:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete student',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
