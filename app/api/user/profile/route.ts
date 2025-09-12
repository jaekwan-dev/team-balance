import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 권한 확인 (관리자이거나 본인의 프로필인 경우만)
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get user profile error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone } = body

    // 사용자가 존재하는지 확인
    const existingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    let updatedUser

    if (existingUser) {
      // 기존 사용자 업데이트
      updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name,
          realName: name,  // 실제 이름을 realName 필드에도 저장
          phone,
          isProfileComplete: true,
        },
      })
    } else {
      // 새 사용자 생성
      updatedUser = await prisma.user.create({
        data: {
          id: session.user.id,
          name,
          realName: name,
          phone,
          email: session.user.email,
          isProfileComplete: true,
          level: "ROOKIE",
          role: "MEMBER",
        },
      })
    }

    return NextResponse.json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
