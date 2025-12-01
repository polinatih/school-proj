// src/app/(dashboard)/list/students/[id]/page.tsx

import Announcements from "@/components/Announcements";
import BigCalendar from "@/components/BigCalender";
import Performance from "@/components/Performance";
import { getRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FormModal from "@/components/FormModal";

const SingleStudentPage = async ({ 
  params 
}: { 
  params: Promise<{ id: string }> // Изменено: теперь Promise
}) => {
  const role = await getRole();
  
  // ВАЖНО: await для params
  const { id } = await params;

  // Получаем данные студента из БД
  const student = await prisma.student.findUnique({
    where: { id }, // Используем распакованный id
    include: {
      class: {
        include: {
          grade: true,
        },
      },
      grade: true,
      parent: true,
      attendances: {
        include: {
          lesson: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        take: 10,
      },
      results: {
        include: {
          exam: {
            include: {
              lesson: {
                include: {
                  subject: true,
                },
              },
            },
          },
          assignment: {
            include: {
              lesson: {
                include: {
                  subject: true,
                },
              },
            },
          },
        },
        orderBy: {
          id: "desc",
        },
        take: 10,
      },
      _count: {
        select: {
          attendances: true,
          results: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Вычисляем attendance percentage
  const totalAttendances = student.attendances.length;
  const presentCount = student.attendances.filter((a) => a.present).length;
  const attendancePercentage = totalAttendances > 0 
    ? Math.round((presentCount / totalAttendances) * 100) 
    : 0;

  const formattedBirthday = new Date(student.birthday).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      {/* LEFT */}
      <div className="w-full xl:w-2/3">
        {/* TOP */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* USER INFO CARD */}
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3">
              <Image
                src={student.img || "/avatar.png"}
                alt={`${student.name} ${student.surname}`}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover"
              />
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {student.name} {student.surname}
                </h1>
                {role === "admin" && (
                  <FormModal
                    table="student"
                    type="update"
                    data={{
                      id: student.id,
                      username: student.username,
                      email: student.email,
                      password: "",
                      firstName: student.name,
                      lastName: student.surname,
                      phone: student.phone,
                      address: student.address,
                      bloodType: student.bloodType,
                      dateOfBirth: student.birthday,
                      sex: student.sex,
                      img: student.img,
                      gradeId: student.gradeId,
                      classId: student.classId,
                      parentId: student.parentId,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                Class {student.class.name} - Grade {student.grade.level}
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="" width={14} height={14} />
                  <span>{student.bloodType || "N/A"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="" width={14} height={14} />
                  <span>{formattedBirthday}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="" width={14} height={14} />
                  <span>{student.email || "No email"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="" width={14} height={14} />
                  <span>{student.phone || "No phone"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SMALL CARDS */}
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            {/* Attendance Card */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleAttendance.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">{attendancePercentage}%</h1>
                <span className="text-sm text-gray-400">Attendance</span>
              </div>
            </div>

            {/* Grade Card */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleBranch.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">{student.grade.level}th</h1>
                <span className="text-sm text-gray-400">Grade</span>
              </div>
            </div>

            {/* Results Card */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleLesson.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {student._count.results}
                </h1>
                <span className="text-sm text-gray-400">Results</span>
              </div>
            </div>

            {/* Class Card */}
            <div className="bg-white p-4 rounded-md flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%]">
              <Image
                src="/singleClass.png"
                alt=""
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">{student.class.name}</h1>
                <span className="text-sm text-gray-400">Class</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM - Schedule */}
        <div className="mt-4 bg-white rounded-md p-4 h-[800px]">
          <h1 className="text-xl font-semibold mb-4">Student&apos;s Schedule</h1>
          <BigCalendar />
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        {/* Shortcuts */}
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Shortcuts</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition"
              href={`/list/lessons?classId=${student.classId}`}
            >
              Student&apos;s Lessons
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight hover:bg-lamaPurple hover:text-white transition"
              href={`/list/teachers?classId=${student.classId}`}
            >
              Student&apos;s Teachers
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50 hover:bg-pink-100 transition"
              href={`/list/exams?classId=${student.classId}`}
            >
              Student&apos;s Exams
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight hover:bg-lamaSky transition"
              href={`/list/assignments?classId=${student.classId}`}
            >
              Student&apos;s Assignments
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight hover:bg-lamaYellow transition"
              href={`/list/results?studentId=${student.id}`}
            >
              Student&apos;s Results
            </Link>
          </div>
        </div>

        <Performance />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;