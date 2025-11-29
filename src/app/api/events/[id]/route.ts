// src/app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const event = await prisma.event.findUnique({
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

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error('❌ Error fetching event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // Валидация дат (если обновляются обе)
    if (body.startTime && body.endTime) {
      const start = new Date(body.startTime)
      const end = new Date(body.endTime)

      if (end <= start) {
        return NextResponse.json(
          {
            success: false,
            error: 'End time must be after start time',
          },
          { status: 400 }
        )
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description !== undefined && { 
          description: body.description || null 
        }),
        ...(body.startTime && { startTime: new Date(body.startTime) }),
        ...(body.endTime && { endTime: new Date(body.endTime) }),
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
      message: 'Event updated successfully',
      data: updatedEvent,
    })
  } catch (error) {
    console.error('❌ Error updating event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}