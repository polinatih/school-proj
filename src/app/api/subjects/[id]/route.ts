// src/app/api/subjects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/subjects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: true,
        lessons: {
          include: {
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

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: subject })
  } catch (error) {
    console.error('❌ Error fetching subject:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subject',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/subjects/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingSubject = await prisma.subject.findUnique({
      where: { id },
    })

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (body.name) {
      updateData.name = body.name
    }

    if (body.teacherIds) {
      updateData.teachers = {
        set: body.teacherIds.map((id: string) => ({ id })),
      }
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        teachers: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject,
    })
  } catch (error) {
    console.error('❌ Error updating subject:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update subject',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/subjects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    })

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    if (existingSubject._count.lessons > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete subject with existing lessons',
          details: {
            lessons: existingSubject._count.lessons,
          },
        },
        { status: 409 }
      )
    }

    await prisma.subject.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting subject:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete subject',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}