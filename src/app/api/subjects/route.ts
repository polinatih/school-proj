// src/app/api/subjects/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/subjects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : {}

    const subjects = await prisma.subject.findMany({
      where,
      skip,
      take: limit,
      include: {
        teachers: {
          select: {
            id: true,
            name: true,
            surname: true,
          },
        },
        _count: {
          select: {
            teachers: true,
            lessons: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const total = await prisma.subject.count({ where })

    return NextResponse.json({
      success: true,
      data: subjects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching subjects:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subjects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/subjects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name } = body

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: name',
        },
        { status: 400 }
      )
    }

    // Проверка уникальности
    const existingSubject = await prisma.subject.findUnique({
      where: { name },
    })

    if (existingSubject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subject with this name already exists',
        },
        { status: 409 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        ...(body.teacherIds && {
          teachers: {
            connect: body.teacherIds.map((id: string) => ({ id })),
          },
        }),
      },
      include: {
        teachers: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Subject created successfully',
        data: subject,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating subject:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subject',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}