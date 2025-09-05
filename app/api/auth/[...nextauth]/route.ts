import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers

// Edge Runtime을 비활성화하여 Prisma 호환성 확보
export const runtime = 'nodejs'
