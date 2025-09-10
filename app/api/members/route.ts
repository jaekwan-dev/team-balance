import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 모든 팀원 목록 조회 (일반 사용자도 접근 가능)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // 모든 사용자 조회 (권한에 따라 다른 정보 제공)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: session.user.role === 'ADMIN' ? true : false, // 관리자만 이메일 조회
        phone: session.user.role === 'ADMIN' ? true : false, // 관리자만 전화번호 조회
        level: true,
        role: true,
        isProfileComplete: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 멤버 레벨 업데이트 (관리자 전용)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, level } = body

    if (!userId || !level) {
      return NextResponse.json({ error: "사용자 ID와 레벨이 필요합니다" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { level },
      select: {
        id: true,
        name: true,
        level: true,
      }
    })

    return NextResponse.json({ 
      message: "레벨이 업데이트되었습니다",
      user: updatedUser 
    })
  } catch (error) {
    console.error("Update member level error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
