import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/announcements/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        class: {
          include: {
            grade: true,
            students: {
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

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: announcement })
  } catch (error) {
    console.error('❌ Error fetching announcement:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch announcement',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/announcements/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { 
          description: body.description || null 
        }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.classId !== undefined && { 
          classId: body.classId ? parseInt(body.classId) : null 
        }),
      },
      include: {
        class: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement,
    })
  } catch (error) {
    console.error('❌ Error updating announcement:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update announcement',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/announcements/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id },
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { success: false, error: 'Announcement not found' },
        { status: 404 }
      )
    }

    await prisma.announcement.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting announcement:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete announcement',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}