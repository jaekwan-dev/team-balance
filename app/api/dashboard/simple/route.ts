import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schedules, attendances, users, comments } from '@/lib/db/schema'
import { eq, and, gte, asc, count, sql } from 'drizzle-orm'

export const runtime = 'nodejs'
export const maxDuration = 10
// auth()가 headers를 사용하므로 동적 렌더링 필요
export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    const now = new Date()
    const userId = session.user.id

    // ✅ 최적화: 모든 쿼리를 단일 Promise.all로 병합
    const [
      nextSchedule,
      userAttendStats,
      totalMembers,
    ] = await Promise.all([
      // 1. 다음 경기 + 참석자 목록 (클라이언트 호환성)
      db.query.schedules.findFirst({
        where: gte(schedules.date, now),
        orderBy: [asc(schedules.date)],
        columns: {
          id: true,
          title: true,
          date: true,
          location: true,
          description: true,
          maxParticipants: true,
        },
        with: {
          createdBy: {
            columns: {
              id: true,
              name: true,
            },
          },
          // 참석자 목록 포함 (클라이언트에서 사용)
          attendances: {
            columns: {
              id: true,
              status: true,
              guestName: true,
              guestLevel: true,
              userId: true,
              invitedBy: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  realName: true,
                  level: true,
                },
              },
              inviter: {
                columns: {
                  id: true,
                  name: true,
                  realName: true,
                },
              },
            },
          },
        },
      }),

      // 2. 사용자 참석률 - COUNT 쿼리로 최적화 (전체 레코드 안 가져옴)
      db.select({
        total: count(),
        attended: sql<number>`SUM(CASE WHEN ${attendances.status} = 'ATTEND' THEN 1 ELSE 0 END)::int`,
      })
        .from(attendances)
        .where(and(
          eq(attendances.userId, userId),
          sql`${attendances.guestName} IS NULL`
        )),

      // 3. 전체 회원 수
      db.select({ count: count() }).from(users),
    ])

    // 다음 경기가 있으면 참석/댓글 수 추가 (병렬)
    let nextScheduleWithCount = null
    if (nextSchedule) {
      const [attendCountResult, commentCountResult] = await Promise.all([
        db.select({ count: count() })
          .from(attendances)
          .where(and(
            eq(attendances.scheduleId, nextSchedule.id),
            eq(attendances.status, 'ATTEND')
          )),
        db.select({ count: count() })
          .from(comments)
          .where(eq(comments.scheduleId, nextSchedule.id)),
      ])

      nextScheduleWithCount = {
        ...nextSchedule,
        _count: {
          attendances: Number(attendCountResult[0]?.count || 0),
          comments: Number(commentCountResult[0]?.count || 0),
        },
      }
    }

    const total = Number(userAttendStats[0]?.total || 0)
    const attended = Number(userAttendStats[0]?.attended || 0)
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0

    const executionTime = Date.now() - startTime

    return NextResponse.json({
      nextSchedule: nextScheduleWithCount,
      upcomingSchedules: [],
      recentActivities: [],
      stats: {
        attendanceRate,
        totalMembers: Number(totalMembers[0]?.count || 0),
        totalSchedules: 0,
      },
      executionTime: `${executionTime}ms`,
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Dashboard Simple] Error after ${executionTime}ms:`, error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다", details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
