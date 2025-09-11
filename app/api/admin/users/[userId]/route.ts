import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Level, Role } from "@prisma/client"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 특정 회원 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // 관리자이거나 본인의 정보인 경우만 조회 가능
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        attendances: {
          include: {
            schedule: {
              select: {
                title: true,
                date: true,
                location: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        teamMembers: {
          include: {
            team: {
              include: {
                schedule: {
                  select: {
                    title: true,
                    date: true
                  }
                }
              }
            }
          },
          orderBy: {
            team: {
              schedule: {
                date: 'desc'
              }
            }
          },
          take: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 회원 정보 수정 (관리자 전용)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const body = await request.json()
    const { level, role } = body

    // 유효성 검사
    if (level && !Object.values(Level).includes(level)) {
      return NextResponse.json({ error: "유효하지 않은 레벨입니다" }, { status: 400 })
    }

    if (role && !Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "유효하지 않은 권한입니다" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(level && { level }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        role: true,
        position: true,
        isProfileComplete: true,
        createdAt: true,
      }
    })

    return NextResponse.json({ 
      message: "회원 정보가 업데이트되었습니다",
      user: updatedUser 
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

