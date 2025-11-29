// src/app/api/announcements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/announcements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const classId = searchParams.get('classId')
    const recent = searchParams.get('recent') // "true" для последних объявлений

    const skip = (page - 1) * limit

    const where: any = {}

    if (classId) {
      where.classId = parseInt(classId)
    }

    if (recent === 'true') {
      // Объявления за последние 30 дней
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      where.date = {
        gte: thirtyDaysAgo,
      }
    }

    const announcements = await prisma.announcement.findMany({
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
        date: 'desc',
      },
    })

    const total = await prisma.announcement.count({ where })

    return NextResponse.json({
      success: true,
      data: announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching announcements:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch announcements',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/announcements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { title, date } = body

    if (!title || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['title', 'date'],
        },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        description: body.description || null,
        date: new Date(date),
        ...(body.classId && { classId: parseInt(body.classId) }),
      },
      include: {
        class: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Announcement created successfully',
        data: announcement,
      },
      { status: 201 }
    )} catch (error) {
console.error('❌ Error creating announcement:', error)
return NextResponse.json(
{
success: false,
error: 'Failed to create announcement',
message: error instanceof Error ? error.message : 'Unknown error',
},
{ status: 500 }
)
}
}