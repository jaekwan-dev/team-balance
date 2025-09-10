import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 팀편성 결과 삭제 (참석자 변경 시 자동 호출)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // 팀편성 데이터 삭제
    await prisma.team.deleteMany({
      where: { scheduleId }
    })

    console.log(`팀편성 삭제 완료: 일정 ${scheduleId}`)

    return NextResponse.json({ 
      message: "팀편성이 삭제되었습니다" 
    })
  } catch (error) {
    console.error("팀편성 삭제 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// Node.js runtime 사용
export const runtime = 'nodejs'
