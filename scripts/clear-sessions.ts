import { prisma } from "../lib/prisma"

async function clearSessions() {
  try {
    // 모든 세션 삭제
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`Deleted ${deletedSessions.count} sessions`)
    
    // 모든 계정 연결 확인
    const accounts = await prisma.account.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            realName: true,
            isProfileComplete: true
          }
        }
      }
    })
    
    console.log("\nExisting accounts:")
    accounts.forEach(account => {
      console.log(`- Provider: ${account.provider}, User: ${account.user.name}, ProfileComplete: ${account.user.isProfileComplete}`)
    })
    
  } catch (error) {
    console.error("Error clearing sessions:", error)
  } finally {
    await prisma.$disconnect()
  }
}

clearSessions()