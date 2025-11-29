// src/app/api/events/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const classId = searchParams.get('classId')
    const upcoming = searchParams.get('upcoming') // "true" для будущих событий

    const skip = (page - 1) * limit

    const where: any = {}

    if (classId) {
      where.classId = parseInt(classId)
    }

    if (upcoming === 'true') {
      where.startTime = {
        gte: new Date(), // События, которые начинаются сейчас или в будущем
      }
    }

    const events = await prisma.event.findMany({
      where,
      skip,
      take: limit,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: {
              select: {
                level: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    const total = await prisma.event.count({ where })

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching events:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { title, startTime, endTime } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['title', 'startTime', 'endTime'],
        },
        { status: 400 }
      )
    }

    // Валидация дат
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      return NextResponse.json(
        {
          success: false,
          error: 'End time must be after start time',
        },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: body.description || null,
        startTime: start,
        endTime: end,
        ...(body.classId && { classId: parseInt(body.classId) }),
      },
      include: {
        class: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Event created successfully',
        data: event,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create event',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}