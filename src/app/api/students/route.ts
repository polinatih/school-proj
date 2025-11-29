// src/app/api/students/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students - Получение списка студентов
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
          ],
        }
      : {}

    const students = await prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        class: true,
        grade: true,
        parent: {
          select: {
            id: true,
            name: true,
            surname: true,
            phone: true,
          },
        },
        _count: {
          select: {
            attendances: true,
            results: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const total = await prisma.student.count({ where })

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching students:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch students',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/students - Создание студента
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { username, name, surname, sex, birthday, parentId, classId, gradeId } = body

    // Валидация обязательных полей
    if (!username || !name || !surname || !sex || !birthday || !parentId || !classId || !gradeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['username', 'name', 'surname', 'sex', 'birthday', 'parentId', 'classId', 'gradeId'],
        },
        { status: 400 }
      )
    }

    // Проверка уникальности
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { username },
          ...(body.email ? [{ email: body.email }] : []),
        ],
      },
    })

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student with this username or email already exists',
        },
        { status: 409 }
      )
    }

    // Создание студента
    const student = await prisma.student.create({
      data: {
        username,
        name,
        surname,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        img: body.img || null,
        bloodType: body.bloodType || null,
        sex,
        birthday: new Date(birthday),
        parentId,
        classId: parseInt(classId),
        gradeId: parseInt(gradeId),
      },
      include: {
        class: true,
        grade: true,
        parent: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Student created successfully',
        data: student,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating student:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create student',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}