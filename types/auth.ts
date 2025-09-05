import type { DefaultSession } from "next-auth"
import type { Role, Level } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      level: Level
      isProfileComplete: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    kakaoId?: string
    role: Role
    level: Level
    isProfileComplete: boolean
  }
}

