// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Создаем Grades
  const grades = await Promise.all([
    prisma.grade.upsert({
      where: { level: 1 },
      update: {},
      create: { level: 1 },
    }),
    prisma.grade.upsert({
      where: { level: 2 },
      update: {},
      create: { level: 2 },
    
    }),
    prisma.grade.upsert({
      where: { level: 3 },
      update: {},
      create: { level: 3 },
    }),
    prisma.grade.upsert({
      where: { level: 4 },
      update: {},
      create: { level: 4 },
    }),
    prisma.grade.upsert({
      where: { level: 5 },
      update: {},
      create: { level: 5 },
    }),
  ])

  console.log('✅ Grades created')

  // Создаем Admin
  await prisma.admin.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@school.com',
      password: 'admin123', // В production использовать bcrypt!
    },
  })

  console.log('✅ Admin created')

  // Создаем Teachers
  const teacher1 = await prisma.teacher.upsert({
    where: { email: 'john.doe@school.com' },
    update: {},
    create: {
      username: 'teacher1',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@school.com',
      phone: '1234567890',
      address: '123 Main St',
      sex: 'male',
      birthday: new Date('1980-01-01'),
    },
  })

  const teacher2 = await prisma.teacher.upsert({
    where: { email: 'jane.smith@school.com' },
    update: {},
    create: {
      username: 'teacher2',
      name: 'Jane',
      surname: 'Smith',
      email: 'jane.smith@school.com',
      phone: '0987654321',
      address: '456 Oak Ave',
      sex: 'female',
      birthday: new Date('1985-05-15'),
    },
  })

  console.log('✅ Teachers created')

  // Создаем Subjects
  const mathSubject = await prisma.subject.upsert({
    where: { name: 'Mathematics' },
    update: {},
    create: {
      name: 'Mathematics',
      teachers: {
        connect: [{ id: teacher1.id }],
      },
    },
  })

  const englishSubject = await prisma.subject.upsert({
    where: { name: 'English' },
    update: {},
    create: {
      name: 'English',
      teachers: {
        connect: [{ id: teacher2.id }],
      },
    },
  })

  console.log('✅ Subjects created')

  // Создаем Classes
  const class1A = await prisma.class.upsert({
    where: { name: '1A' },
    update: {},
    create: {
      name: '1A',
      capacity: 20,
      gradeId: grades[0].id,
      supervisorId: teacher1.id,
    },
  })

  const class1B = await prisma.class.upsert({
    where: { name: '1B' },
    update: {},
    create: {
      name: '1B',
      capacity: 22,
      gradeId: grades[0].id,
      supervisorId: teacher2.id,
    },
  })

  console.log('✅ Classes created')

  // Создаем Parents
  const parent1 = await prisma.parent.upsert({
    where: { email: 'michael.j@email.com' },
    update: {},
    create: {
      username: 'parent1',
      name: 'Michael',
      surname: 'Johnson',
      email: 'michael.j@email.com',
      phone: '5551234567',
      address: '789 Elm St',
    },
  })

  const parent2 = await prisma.parent.upsert({
    where: { email: 'sarah.w@email.com' },
    update: {},
    create: {
      username: 'parent2',
      name: 'Sarah',
      surname: 'Williams',
      email: 'sarah.w@email.com',
      phone: '5559876543',
      address: '321 Pine Rd',
    },
  })

  console.log('✅ Parents created')

  // Создаем Students
  await prisma.student.upsert({
    where: { email: 'alex.j@student.com' },
    update: {},
    create: {
      username: 'student1',
      name: 'Alex',
      surname: 'Johnson',
      email: 'alex.j@student.com',
      phone: '5551111111',
      address: '789 Elm St',
      sex: 'male',
      birthday: new Date('2010-03-15'),
      parentId: parent1.id,
      classId: class1A.id,
      gradeId: grades[0].id,
    },
  })

  await prisma.student.upsert({
    where: { email: 'emma.w@student.com' },
    update: {},
    create: {
      username: 'student2',
      name: 'Emma',
      surname: 'Williams',
      email: 'emma.w@student.com',
      phone: '5552222222',
      address: '321 Pine Rd',
      sex: 'female',
      birthday: new Date('2010-07-22'),
      parentId: parent2.id,
      classId: class1A.id,
      gradeId: grades[0].id,
    },
  })

  console.log('✅ Students created')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })