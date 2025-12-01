import { clerkClient, auth } from "@clerk/nextjs/server";

export type Role = "admin" | "teacher" | "student" | "parent";

type MetadataWithRole = { role?: Role };

// Проверка роли
export const checkRole = async (role: Role): Promise<boolean> => {
  const userRole = await getRole();
  return userRole === role;
};

// Получение роли пользователя
export const getRole = async (): Promise<Role> => {
  const session = await auth(); // ждем Promise
  const userId = session.userId;
  if (!userId) return "student";

  // В новых версиях clerkClient — это функция
  const client = await clerkClient(); 
  const user = await client.users.getUser(userId);

  const role = (user.publicMetadata as MetadataWithRole)?.role || "student";
  return role;
};
