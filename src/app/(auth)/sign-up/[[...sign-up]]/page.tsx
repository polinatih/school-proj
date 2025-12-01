// src/app/(auth)/sign-up/[[...sign-up]]/page.tsx

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <SignUp />
    </div>
  );
}