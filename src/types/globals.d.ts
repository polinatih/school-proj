// src/types/globals.d.ts

export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "admin" | "teacher" | "student" | "parent"
    }
  }
}