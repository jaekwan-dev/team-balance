import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 댓글 조회 (등록일 오름차순)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params

    const comments = await prisma.comment.findMany({
      where: { scheduleId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            level: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // 먼저 등록된 순서
    })

    return NextResponse.json({ comments })
  } catch (error) {
    console.error("댓글 조회 오류:", error)
    return NextResponse.json(
      { error: "댓글을 불러오는데 실패했습니다" },
      { status: 500 }
    )
  }
}

// 댓글 작성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const session = await auth()
    const { scheduleId } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "댓글 내용을 입력해주세요" }, { status: 400 })
    }

    if (content.trim().length > 500) {
      return NextResponse.json({ error: "댓글은 500자 이하로 입력해주세요" }, { status: 400 })
    }

    // 일정 존재 확인
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId }
    })

    if (!schedule) {
      return NextResponse.json({ error: "존재하지 않는 일정입니다" }, { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        scheduleId,
        userId: session.user.id,
        content: content.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            level: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: "댓글이 등록되었습니다",
      comment 
    })
  } catch (error) {
    console.error("댓글 작성 오류:", error)
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다" },
      { status: 500 }
    )
  }
}

// Node.js runtime 사용
export const runtime = 'nodejs'
