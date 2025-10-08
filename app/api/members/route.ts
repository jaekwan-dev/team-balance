import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"

// Node.js 런타임 사용
export const runtime = 'nodejs'

// 모든 팀원 목록 조회 (일반 사용자도 접근 가능)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const isAdmin = session.user.role === 'ADMIN'

    // 모든 사용자 조회
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    })

    // 권한에 따라 이메일/전화번호 필터링
    const usersList = allUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: isAdmin ? user.email : null,
      phone: isAdmin ? user.phone : null,
      level: user.level,
      role: user.role,
      isProfileComplete: user.isProfileComplete,
      createdAt: user.createdAt,
    }))

    return NextResponse.json({ users: usersList })
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

    const updatedUser = await db
      .update(users)
      .set({ level, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        level: users.level,
      })

    return NextResponse.json({ 
      message: "레벨이 업데이트되었습니다",
      user: updatedUser[0] 
    })
  } catch (error) {
    console.error("Update member level error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}