import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 일정 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const upcoming = searchParams.get('upcoming') === 'true'

    const schedules = await prisma.schedule.findMany({
      where: upcoming ? {
        date: {
          gte: new Date()
        }
      } : undefined,
      orderBy: {
        date: upcoming ? 'asc' : 'desc'
      },
      include: {
        createdBy: {
          select: {
            name: true,
            role: true
          }
        },
        _count: {
          select: {
            attendances: true,
            comments: true
          }
        },
        attendances: {
          where: {
            userId: session.user.id
          },
          select: {
            status: true
          }
        }
      },
      take: 20
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("Get schedules error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 일정 생성 (관리자 전용)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const body = await request.json()
    const { title, date, location, description, maxParticipants } = body

    if (!title || !date || !location) {
      return NextResponse.json({ error: "필수 필드가 누락되었습니다" }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        title,
        date: new Date(date),
        location,
        description,
        maxParticipants,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            role: true
          }
        },
        _count: {
          select: {
            attendances: true,
            comments: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "일정이 생성되었습니다",
      schedule 
    })
  } catch (error) {
    console.error("Create schedule error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}


