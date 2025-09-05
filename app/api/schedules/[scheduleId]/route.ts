import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 특정 일정 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        createdBy: {
          select: {
            name: true,
            role: true
          }
        },
        attendances: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                level: true,
                position: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    level: true,
                    position: true
                  }
                }
              }
            }
          },
          orderBy: {
            teamNumber: 'asc'
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다" }, { status: 404 })
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error("Get schedule error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 일정 수정 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const body = await request.json()
    const { title, date, location, description } = body

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(title && { title }),
        ...(date && { date: new Date(date) }),
        ...(location && { location }),
        ...(description !== undefined && { description }),
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
      message: "일정이 수정되었습니다",
      schedule: updatedSchedule 
    })
  } catch (error) {
    console.error("Update schedule error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 일정 삭제 (관리자 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    await prisma.schedule.delete({
      where: { id: scheduleId }
    })

    return NextResponse.json({ message: "일정이 삭제되었습니다" })
  } catch (error) {
    console.error("Delete schedule error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}


