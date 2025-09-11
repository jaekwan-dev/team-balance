import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 전체 일정 조회 (관리자 전용)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const schedules = await prisma.schedule.findMany({
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        description: true,
        maxParticipants: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            attendances: {
              where: {
                status: 'ATTEND'
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc' // 최신 일정부터
      }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Get all schedules error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// Node.js runtime 사용
export const runtime = 'nodejs'
