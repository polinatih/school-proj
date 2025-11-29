// src/app/api/parents/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/parents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            class: true,
            grade: true,
          },
        },
      },
    })

    if (!parent) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: parent })
  } catch (error) {
    console.error('❌ Error fetching parent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch parent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/parents/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const existingParent = await prisma.parent.findUnique({
      where: { id },
    })

    if (!existingParent) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
        { status: 404 }
      )
    }

    const updatedParent = await prisma.parent.update({
      where: { id },
      data: {
        ...(body.username && { username: body.username }),
        ...(body.name && { name: body.name }),
        ...(body.surname && { surname: body.surname }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address || null }),
      },
      include: {
        students: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Parent updated successfully',
      data: updatedParent,
    })
  } catch (error) {
    console.error('❌ Error updating parent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update parent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/parents/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingParent = await prisma.parent.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    })

    if (!existingParent) {
      return NextResponse.json(
        { success: false, error: 'Parent not found' },
        { status: 404 }
      )
    }

    if (existingParent._count.students > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete parent with existing students',
          details: {
            students: existingParent._count.students,
          },
        },
        { status: 409 }
      )
    }

    await prisma.parent.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Parent deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting parent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete parent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}