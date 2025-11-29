// src/app/api/parents/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/parents - Получение списка родителей
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { surname: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const parents = await prisma.parent.findMany({
      where,
      skip,
      take: limit,
      include: {
        students: {
          select: {
            id: true,
            name: true,
            surname: true,
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const total = await prisma.parent.count({ where })

    return NextResponse.json({
      success: true,
      data: parents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching parents:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch parents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/parents - Создание родителя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { username, name, surname, phone } = body

    if (!username || !name || !surname || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['username', 'name', 'surname', 'phone'],
        },
        { status: 400 }
      )
    }

    // Проверка уникальности
    const existingParent = await prisma.parent.findFirst({
      where: {
        OR: [
          { username },
          ...(body.email ? [{ email: body.email }] : []),
        ],
      },
    })

    if (existingParent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parent with this username or email already exists',
        },
        { status: 409 }
      )
    }

    const parent = await prisma.parent.create({
      data: {
        username,
        name,
        surname,
        email: body.email || null,
        phone,
        address: body.address || null,
      },
      include: {
        students: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Parent created successfully',
        data: parent,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating parent:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create parent',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}