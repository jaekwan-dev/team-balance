import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schedules, attendances, users } from '@/lib/db/schema'
import { eq, and, gte, desc, count, sql } from 'drizzle-orm'

export const runtime = 'nodejs'
export const maxDuration = 10
export const revalidate = 300 // 5분 캐싱

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log('[Dashboard Simple] Starting...')
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const now = new Date()
    const userId = session.user.id
    
    // 최소한의 쿼리만 실행
    const [nextSchedule, userStats, totalMembers] = await Promise.all([
      // 다음 경기만
      db.query.schedules.findFirst({
        where: gte(schedules.date, now),
        orderBy: [desc(schedules.date)],
        columns: {
          id: true,
          title: true,
          date: true,
          location: true,
        },
      }),
      
      // 사용자 참석률
      db.select({ status: attendances.status })
        .from(attendances)
        .where(and(
          eq(attendances.userId, userId),
          sql`${attendances.guestName} IS NULL`
        )),
      
      // 전체 회원 수
      db.select({ count: count() }).from(users),
    ])
    
    const executionTime = Date.now() - startTime
    console.log(`[Dashboard Simple] Completed in ${executionTime}ms`)
    
    const totalAttendances = userStats.length
    const attendedCount = userStats.filter(a => a.status === 'ATTEND').length
    const attendanceRate = totalAttendances > 0 
      ? Math.round((attendedCount / totalAttendances) * 100) 
      : 0
    
    return NextResponse.json({
      nextSchedule: nextSchedule || null,
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

