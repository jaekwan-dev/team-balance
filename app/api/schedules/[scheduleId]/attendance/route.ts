import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
// AttendanceStatus 상수 정의
const ATTENDANCE_STATUS_VALUES = ['PENDING', 'ATTEND', 'ABSENT'] as const

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 참석 투표
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const body = await request.json()
    const { status, guestName, guestLevel } = body

    if (!ATTENDANCE_STATUS_VALUES.includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 참석 상태입니다" }, { status: 400 })
    }

    // 일정 존재 확인
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        _count: {
          select: {
            attendances: {
              where: { status: 'ATTEND' }
            }
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다" }, { status: 404 })
    }

    // 참석 마감 확인 (게스트 참석 시에만)
    if (guestName && status === 'ATTEND') {
      if (schedule._count.attendances >= (schedule.maxParticipants || 15)) {
        return NextResponse.json({ error: "참석 인원이 마감되었습니다" }, { status: 400 })
      }
    }

    let attendance
    if (guestName) {
      // 게스트 참석 - 새 기록 생성 (초대자 정보 포함)
      attendance = await prisma.attendance.create({
        data: {
          scheduleId: scheduleId,
          userId: session.user.id, // 초대자 ID 저장
          status,
          guestName,
          guestLevel,
        }
      })
    } else {
      // 일반 사용자 참석 처리 (게스트가 아닌 본인의 참석 정보만)
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          scheduleId: scheduleId,
          userId: session.user.id,
          guestName: null  // 게스트가 아닌 본인의 참석 정보만
        }
      })

      if (existingAttendance) {
        // 기존 기록 업데이트
        attendance = await prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: { status }
        })
      } else {
        // 새 기록 생성
        attendance = await prisma.attendance.create({
          data: {
            scheduleId: scheduleId,
            userId: session.user.id,
            status,
          }
        })
      }
    }

    return NextResponse.json({ 
      message: "참석 상태가 업데이트되었습니다",
      attendance 
    })
  } catch (error) {
    console.error("Attendance update error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}


