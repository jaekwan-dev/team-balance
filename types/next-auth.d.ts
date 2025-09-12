import { DefaultSession } from "next-auth"
import { Role, Level } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      level: Level
      isProfileComplete: boolean
      kakaoId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
    level: Level
    isProfileComplete: boolean
    kakaoId?: string
    emailVerified?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role
    level?: Level
    isProfileComplete?: boolean
    kakaoId?: string
    email_verified?: boolean
    sub?: string
  }
}