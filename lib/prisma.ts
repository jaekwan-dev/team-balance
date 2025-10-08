import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 빌드 시에는 환경 변수가 없을 수 있으므로 lazy initialization
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    // 환경 변수가 없으면 더미 URL 사용 (빌드 시에만)
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy'
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  })()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
