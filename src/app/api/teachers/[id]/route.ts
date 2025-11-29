// src/app/api/teachers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/teachers/[id] - Получение одного учителя
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjects: true, // Включаем предметы
        lessons: {
          include: {
            subject: true,
            class: true,
          },
        },
        classes: true, // Классы, где учитель - supervisor
        _count: {
          select: {
            lessons: true,
            classes: true,
          },
        },
      },
    })

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teacher not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: teacher,
    })
  } catch (error) {
    console.error('❌ Error fetching teacher:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch teacher',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/teachers/[id] - Обновление учителя
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Проверяем существование учителя
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
    })

    if (!existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teacher not found',
        },
        { status: 404 }
      )
    }

    // Проверяем уникальность username/email (если они изменились)
    if (body.username || body.email) {
      const duplicate = await prisma.teacher.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Исключаем текущего учителя
            {
              OR: [
                ...(body.username ? [{ username: body.username }] : []),
                ...(body.email ? [{ email: body.email }] : []),
              ],
            },
          ],
        },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username or email already exists',
          },
          { status: 409 }
        )
      }
    }

    // Обновляем учителя
    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...(body.username && { username: body.username }),
        ...(body.name && { name: body.name }),
        ...(body.surname && { surname: body.surname }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.img !== undefined && { img: body.img || null }),
        ...(body.bloodType !== undefined && { bloodType: body.bloodType || null }),
        ...(body.sex && { sex: body.sex }),
        ...(body.birthday && { birthday: new Date(body.birthday) }),
      },
      include: {
        subjects: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedTeacher,
    })
  } catch (error) {
    console.error('❌ Error updating teacher:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update teacher',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/teachers/[id] - Удаление учителя
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Проверяем существование учителя
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lessons: true,
            classes: true,
          },
        },
      },
    })

    if (!existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          error: 'Teacher not found',
        },
        { status: 404 }
      )
    }

    // Опционально: проверяем, есть ли связанные данные
    if (existingTeacher._count.lessons > 0 || existingTeacher._count.classes > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete teacher with existing lessons or classes',
          details: {
            lessons: existingTeacher._count.lessons,
            classes: existingTeacher._count.classes,
          },
        },
        { status: 409 }
      )
    }

    // Удаляем учителя
    await prisma.teacher.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    })
  } catch (error) {
    console.error('❌ Error deleting teacher:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete teacher',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}