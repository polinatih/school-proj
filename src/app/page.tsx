// src/app/page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  // Если пользователь авторизован - редирект на dashboard
  if (userId) {
    redirect("/admin");
  }

  // Если не авторизован - редирект на sign-in
  redirect("/sign-in");
}