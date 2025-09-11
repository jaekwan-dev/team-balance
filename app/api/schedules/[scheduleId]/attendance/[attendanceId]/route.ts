import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// 게스트 참석자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string; attendanceId: string }> }
) {
  try {
    const session = await auth()
    const { scheduleId, attendanceId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
    }

    // 해당 참석자 정보 조회
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      select: {
        id: true,
        guestName: true,
        userId: true,
        scheduleId: true
      }
    })

    if (!attendance) {
      return NextResponse.json({ error: "참석자를 찾을 수 없습니다" }, { status: 404 })
    }

    if (attendance.scheduleId !== scheduleId) {
      return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 })
    }

    // 게스트만 삭제 가능
    if (!attendance.guestName) {
      return NextResponse.json({ error: "일반 멤버는 삭제할 수 없습니다" }, { status: 400 })
    }

    // 권한 확인: 관리자 또는 게스트를 초대한 사람만 삭제 가능
    const isAdmin = session.user.role === 'ADMIN'
    const isInviter = attendance.userId === session.user.id

    if (!isAdmin && !isInviter) {
      return NextResponse.json({ error: "삭제 권한이 없습니다" }, { status: 403 })
    }

    // 참석자 삭제
    await prisma.attendance.delete({
      where: { id: attendanceId }
    })

    // 팀편성 삭제 (참석자 변경으로 인한)
    await prisma.team.deleteMany({
      where: { scheduleId }
    })

    return NextResponse.json({ 
      message: "게스트 참석자가 삭제되었습니다" 
    })
  } catch (error) {
    console.error("게스트 참석자 삭제 오류:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// Node.js runtime 사용
export const runtime = 'nodejs'
