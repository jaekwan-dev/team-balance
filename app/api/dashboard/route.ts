import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, schedules, attendances, comments } from "@/lib/db/schema"
import { eq, and, gte, lt, desc, asc, count, sql } from "drizzle-orm"

// Node.js 런타임 사용
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const now = new Date()
    const userId = session.user.id

    // 다음 경기 조회 (참석자 명단 포함)
    const nextScheduleResult = await db.query.schedules.findFirst({
      where: gte(schedules.date, now),
      orderBy: [asc(schedules.date)],
      with: {
        attendances: {
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
          orderBy: [asc(attendances.status), asc(attendances.createdAt)],
        },
      },
    })

    // 다음 경기의 count 추가
    let nextSchedule = null
    if (nextScheduleResult) {
      const attendCount = await db
        .select({ count: count() })
        .from(attendances)
        .where(
          and(
            eq(attendances.scheduleId, nextScheduleResult.id),
            eq(attendances.status, 'ATTEND')
          )
        )

      const commentCount = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.scheduleId, nextScheduleResult.id))

      nextSchedule = {
        ...nextScheduleResult,
        _count: {
          attendances: attendCount[0]?.count || 0,
          comments: commentCount[0]?.count || 0,
        },
      }
    }

    // 이후 경기 일정 조회 (다음 경기 제외, 최대 3개)
    const upcomingSchedulesResult = await db.query.schedules.findMany({
      where: gte(schedules.date, now),
      orderBy: [asc(schedules.date)],
      limit: 4, // 다음 경기 포함 4개 조회
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
    })

    // 다음 경기 제외하고 나머지 3개만
    const upcomingSchedulesWithoutNext = upcomingSchedulesResult.slice(1, 4)

    // Count 추가
    const upcomingSchedules = await Promise.all(
      upcomingSchedulesWithoutNext.map(async (schedule) => {
        const attendCount = await db
          .select({ count: count() })
          .from(attendances)
          .where(
            and(
              eq(attendances.scheduleId, schedule.id),
              eq(attendances.status, 'ATTEND')
            )
          )

        const commentCount = await db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.scheduleId, schedule.id))

        return {
          ...schedule,
          _count: {
            attendances: attendCount[0]?.count || 0,
            comments: commentCount[0]?.count || 0,
          },
        }
      })
    )

    // 사용자 참석 통계 (본인 참석 기록만)
    const userAttendanceStats = await db
      .select({ status: attendances.status })
      .from(attendances)
      .where(
        and(
          eq(attendances.userId, userId),
          sql`${attendances.guestName} IS NULL`
        )
      )

    // 최근 활동 내역 (지난 5개 경기)
    const recentActivitiesResult = await db.query.schedules.findMany({
      where: lt(schedules.date, now),
      orderBy: [desc(schedules.date)],
      limit: 5,
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
    })

    // Count 추가
    const recentActivities = await Promise.all(
      recentActivitiesResult.map(async (schedule) => {
        const attendCount = await db
          .select({ count: count() })
          .from(attendances)
          .where(
            and(
              eq(attendances.scheduleId, schedule.id),
              eq(attendances.status, 'ATTEND')
            )
          )

        return {
          ...schedule,
          _count: {
            attendances: attendCount[0]?.count || 0,
          },
        }
      })
    )

    // 전체 회원 수
    const totalMembersResult = await db.select({ count: count() }).from(users)
    const totalMembers = totalMembersResult[0]?.count || 0

    // 전체 일정 수
    const totalSchedulesResult = await db.select({ count: count() }).from(schedules)
    const totalSchedules = totalSchedulesResult[0]?.count || 0

    // 참석률 계산
    const totalAttendances = userAttendanceStats.length
    const attendedCount = userAttendanceStats.filter((a) => a.status === 'ATTEND').length
    const attendanceRate = totalAttendances > 0 ? Math.round((attendedCount / totalAttendances) * 100) : 0

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
    console.error("Dashboard data fetch error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}