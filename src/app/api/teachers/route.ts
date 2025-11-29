// src/app/api/teachers/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/teachers - Получение списка всех учителей
export async function GET(request: NextRequest) {
  try {
    // Получаем параметры из URL (для пагинации и поиска)
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Вычисляем offset для пагинации
    const skip = (page - 1) * limit

    // Условие для поиска (по имени, фамилии, email)
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { surname: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Получаем учителей с пагинацией
    const teachers = await prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      include: {
        subjects: true, // Включаем связанные предметы
        _count: {
          select: {
            lessons: true, // Считаем количество уроков
            classes: true, // Считаем количество классов
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Сортируем по дате создания
      },
    })

    // Получаем общее количество учителей (для пагинации)
    const total = await prisma.teacher.count({ where })

    return NextResponse.json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('❌ Error fetching teachers:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch teachers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/teachers - Создание нового учителя
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из тела запроса
    const body = await request.json()

    // Валидация обязательных полей
    const { username, name, surname, email, phone, sex, birthday } = body

    if (!username || !name || !surname || !sex || !birthday) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['username', 'name', 'surname', 'sex', 'birthday'],
        },
        { status: 400 }
      )
    }

    // Проверяем уникальность username и email
    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
        ],
      },
    })

    if (existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teacher with this username or email already exists',
        },
        { status: 409 }
      )
    }

    // Создаём учителя
    const teacher = await prisma.teacher.create({
      data: {
        username,
        name,
        surname,
        email: email || null,
        phone: phone || null,
        address: body.address || null,
        img: body.img || null,
        bloodType: body.bloodType || null,
        sex,
        birthday: new Date(birthday),
      },
      include: {
        subjects: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Teacher created successfully',
        data: teacher,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error creating teacher:', error)
    
    // Обработка ошибок уникальности Prisma
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username or email already exists',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create teacher',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}