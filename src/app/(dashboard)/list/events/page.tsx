// src/app/(dashboard)/list/events/page.tsx

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

type Event = {
  id: number;
  title: string;
  class: { name: string } | null;
  startTime: Date;
  endTime: Date;
};

const columns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  {
    header: "Start Time",
    accessor: "startTime",
    className: "hidden md:table-cell",
  },
  {
    header: "End Time",
    accessor: "endTime",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const EventListPage = async () => {
  // Получаем роль из Clerk
  const role = await getRole();

  // Получаем данные из БД
  const events = await prisma.event.findMany({
    include: {
      class: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startTime: "desc",
    },
  });

  const renderRow = (item: Event) => {
    const startDate = new Date(item.startTime);
    const endDate = new Date(item.endTime);

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="flex items-center gap-4 p-4">{item.title}</td>
        <td>{item.class?.name || "All Classes"}</td>
        <td className="hidden md:table-cell">
          {startDate.toLocaleDateString()}
        </td>
        <td className="hidden md:table-cell">
          {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </td>
        <td className="hidden md:table-cell">
          {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <>
                <FormModal table="event" type="update" data={item} />
                <FormModal table="event" type="delete" id={item.id} />
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Events</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {role === "admin" && <FormModal table="event" type="create" />}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={events} />
      {/* PAGINATION */}
      <Pagination />
    </div>
  );
};

export default EventListPage;