import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, schedules, attendances, comments } from "@/lib/db/schema"
import { eq, and, gte, lt, desc, asc, count, sql, inArray } from "drizzle-orm"

// Node.js 런타임 사용
export const runtime = 'nodejs'

// 캐시 설정 (5분)
export const revalidate = 300

// Vercel Serverless Function 최대 실행 시간 (초)
// Hobby plan: 10s, Pro: 60s, Enterprise: 300s
export const maxDuration = 10

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('[Dashboard] API called, checking auth...')
    const session = await auth()
    
    if (!session?.user?.id) {
      console.error('[Dashboard] Unauthorized: No session or user ID')
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const now = new Date()
    const userId = session.user.id
    
    console.log('[Dashboard] Auth OK. Starting query for user:', userId, 'at', now.toISOString())

    console.log('[Dashboard] Executing parallel queries...')
    const queryStartTime = Date.now()
    
    // ✅ 개선: 모든 독립적인 쿼리를 병렬로 실행
    const [
      nextScheduleResult,
      upcomingSchedulesResult,
      userAttendanceStats,
      recentActivitiesResult,
      totalMembersResult,
      totalSchedulesResult
    ] = await Promise.all([
      // 1. 다음 경기 조회
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
          attendances: {
            columns: {
              id: true,
              status: true,
              userId: true,
              guestName: true,
              guestLevel: true,
              invitedBy: true,
              createdAt: true,
            },
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  level: true,
                },
              },
              inviter: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: [asc(attendances.status), asc(attendances.createdAt)],
          },
        },
      }),

      // 2. 이후 경기 일정 조회 (4개)
      db.query.schedules.findMany({
        where: gte(schedules.date, now),
        orderBy: [asc(schedules.date)],
        limit: 4,
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
              name: true,
              role: true,
            },
          },
          attendances: {
            where: and(
              eq(attendances.userId, userId),
              sql`${attendances.guestName} IS NULL`
            ),
            columns: {
              status: true,
            },
          },
        },
      }),

      // 3. 사용자 참석 통계
      db
        .select({ status: attendances.status })
        .from(attendances)
        .where(
          and(
            eq(attendances.userId, userId),
            sql`${attendances.guestName} IS NULL`
          )
        ),

      // 4. 최근 활동 내역 (3개로 감소 - 성능 최적화)
      db.query.schedules.findMany({
        where: lt(schedules.date, now),
        orderBy: [desc(schedules.date)],
        limit: 3,
        columns: {
          id: true,
          title: true,
          date: true,
          location: true,
        },
        with: {
          attendances: {
            where: and(
              eq(attendances.userId, userId),
              sql`${attendances.guestName} IS NULL`
            ),
            columns: {
              status: true,
            },
          },
        },
      }),

      // 5. 전체 회원 수
      db.select({ count: count() }).from(users),

      // 6. 전체 일정 수
      db.select({ count: count() }).from(schedules),
    ])
    
    const queryTime = Date.now() - queryStartTime
    console.log(`[Dashboard] Main queries completed in ${queryTime}ms`)

    // ✅ 개선: N+1 문제 해결 - 모든 일정의 count를 한 번에 조회
    const allScheduleIds = [
      nextScheduleResult?.id,
      ...upcomingSchedulesResult.map(s => s.id),
      ...recentActivitiesResult.map(s => s.id),
    ].filter(Boolean) as string[]
    
    console.log('[Dashboard] Fetching counts for', allScheduleIds.length, 'schedules')

    let attendanceCounts: Record<string, number> = {}
    let commentCounts: Record<string, number> = {}

    if (allScheduleIds.length > 0) {
      // 한 번의 쿼리로 모든 참석자 count 조회
      const [attendanceCountResults, commentCountResults] = await Promise.all([
        db
          .select({
            scheduleId: attendances.scheduleId,
            count: count(),
          })
          .from(attendances)
          .where(
            and(
              inArray(attendances.scheduleId, allScheduleIds),
              eq(attendances.status, 'ATTEND')
            )
          )
          .groupBy(attendances.scheduleId),

        db
          .select({
            scheduleId: comments.scheduleId,
            count: count(),
          })
          .from(comments)
          .where(inArray(comments.scheduleId, allScheduleIds))
          .groupBy(comments.scheduleId),
      ])

      // Map으로 변환
      attendanceCounts = Object.fromEntries(
        attendanceCountResults.map(r => [r.scheduleId, Number(r.count)])
      )
      commentCounts = Object.fromEntries(
        commentCountResults.map(r => [r.scheduleId, Number(r.count)])
      )
    }

    // 다음 경기에 count 추가
    const nextSchedule = nextScheduleResult ? {
      ...nextScheduleResult,
      _count: {
        attendances: attendanceCounts[nextScheduleResult.id] || 0,
        comments: commentCounts[nextScheduleResult.id] || 0,
      },
    } : null

    // 이후 경기에 count 추가 (다음 경기 제외)
    const upcomingSchedules = upcomingSchedulesResult
      .slice(1, 4)
      .map(schedule => ({
        ...schedule,
        _count: {
          attendances: attendanceCounts[schedule.id] || 0,
          comments: commentCounts[schedule.id] || 0,
        },
      }))

    // 최근 활동에 count 추가
    const recentActivities = recentActivitiesResult.map(schedule => ({
      ...schedule,
      _count: {
        attendances: attendanceCounts[schedule.id] || 0,
      },
    }))

    // 통계 계산
    const totalMembers = Number(totalMembersResult[0]?.count || 0)
    const totalSchedules = Number(totalSchedulesResult[0]?.count || 0)
    
    const totalAttendances = userAttendanceStats.length
    const attendedCount = userAttendanceStats.filter((a) => a.status === 'ATTEND').length
    const attendanceRate = totalAttendances > 0 
      ? Math.round((attendedCount / totalAttendances) * 100) 
      : 0

    const executionTime = Date.now() - startTime
    console.log(`[Dashboard] Query completed in ${executionTime}ms`)
    
    return NextResponse.json({
      nextSchedule,
      upcomingSchedules,
      recentActivities,
      stats: {
        attendanceRate,
        totalMembers,
        totalSchedules,
      },
    })
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[Dashboard] Error after ${executionTime}ms:`, error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

