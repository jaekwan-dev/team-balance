import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    // 병렬로 데이터 조회
    const [
      nextSchedule,
      upcomingSchedules,
      userAttendanceStats,
      recentActivities,
      totalMembers,
      totalSchedules
    ] = await Promise.all([
      // 다음 경기 조회 (참석자 명단 포함)
      prisma.schedule.findFirst({
        where: {
          date: {
            gte: new Date()
          }
        },
        orderBy: {
          date: 'asc'
        },
        include: {
          _count: {
            select: {
              attendances: {
                where: {
                  status: 'ATTEND'
                }
              }
            }
          },
          attendances: {
            select: {
              id: true,
              status: true,
              userId: true,
              guestName: true,
              guestLevel: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  level: true
                }
              }
            },
            orderBy: [
              { status: 'asc' }, // ATTEND가 먼저 오도록
              { createdAt: 'asc' }
            ]
          }
        }
      }),

      // 이후 경기 일정 조회 (다음 경기 제외)
      prisma.schedule.findMany({
        where: {
          date: {
            gte: new Date()
          }
        },
        orderBy: {
          date: 'asc'
        },
        skip: 1, // 첫 번째(다음 경기) 제외
        take: 3, // 최대 3개만
        include: {
          _count: {
            select: {
              attendances: {
                where: {
                  status: 'ATTEND'
                }
              }
            }
          },
          attendances: {
            where: {
              userId: session.user.id
            },
            select: {
              status: true
            }
          }
        }
      }),

      // 사용자 참석 통계
      prisma.attendance.findMany({
        where: {
          userId: session.user.id
        },
        select: {
          status: true
        }
      }),

      // 최근 활동 내역
      prisma.schedule.findMany({
        where: {
          date: {
            lt: new Date()
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 5,
        include: {
          attendances: {
            where: {
              userId: session.user.id
            },
            select: {
              status: true
            }
          },
          _count: {
            select: {
              attendances: {
                where: {
                  status: 'ATTEND'
                }
              }
            }
          }
        }
      }),

      // 전체 회원 수
      prisma.user.count(),

      // 전체 일정 수
      prisma.schedule.count()
    ])

    // 참석률 계산
    const totalAttendances = userAttendanceStats.length
    const attendedCount = userAttendanceStats.filter(a => a.status === 'ATTEND').length
    const attendanceRate = totalAttendances > 0 ? Math.round((attendedCount / totalAttendances) * 100) : 0

    return NextResponse.json({
      nextSchedule,
      upcomingSchedules,
      attendanceRate,
      totalAttendances,
      attendedCount,
      recentActivities,
      stats: {
        totalMembers,
        totalSchedules,
        myAttendances: totalAttendances
      }
    })
  } catch (error) {
    console.error("Dashboard data error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}


