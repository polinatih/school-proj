// src/app/(dashboard)/list/students/page.tsx

import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { getRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

type Student = {
  id: string;
  username: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  class: { name: string };
  grade: { level: number };
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Student ID",
    accessor: "studentId",
    className: "hidden md:table-cell",
  },
  {
    header: "Grade",
    accessor: "grade",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Address",
    accessor: "address",
className: "hidden lg:table-cell",
},
{
header: "Actions",
accessor: "action",
},
];
const StudentListPage = async () => {
const role = await getRole();
const students = await prisma.student.findMany({
include: {
class: true,
grade: true,
},
orderBy: {
createdAt: "desc",
},
});
const renderRow = (item: Student) => (
<tr
   key={item.id}
   className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
 >
<td className="flex items-center gap-4 p-4">
<div className="flex flex-col">
<h3 className="font-semibold">
{item.name} {item.surname}
</h3>
<p className="text-xs text-gray-500">{item.class.name}</p>
</div>
</td>
<td className="hidden md:table-cell">{item.username}</td>
<td className="hidden md:table-cell">{item.grade.level}</td>
<td className="hidden md:table-cell">{item.phone}</td>
<td className="hidden md:table-cell">{item.address}</td>
<td>
<div className="flex items-center gap-2">
<Link href={`/list/students/${item.id}`}>
<button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
<Image src="/view.png" alt="" width={16} height={16} />
</button>
</Link>
{role === "admin" && (
<FormModal table="student" type="delete" id={item.id} />
)}
</div>
</td>
</tr>
);
return (
<div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
{/* TOP */}
<div className="flex items-center justify-between">
<h1 className="hidden md:block text-lg font-semibold">All Students</h1>
<div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
<TableSearch />
<div className="flex items-center gap-4 self-end">
<button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
<Image src="/filter.png" alt="" width={14} height={14} />
</button>
<button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
<Image src="/sort.png" alt="" width={14} height={14} />
</button>
{role === "admin" && <FormModal table="student" type="create" />}
</div>
</div>
</div>
{/* LIST */}
<Table columns={columns} renderRow={renderRow} data={students} />
{/* PAGINATION */}
<Pagination />
</div>
);
};
export default StudentListPage;