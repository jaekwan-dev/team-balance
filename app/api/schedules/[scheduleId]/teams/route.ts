import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 팀편성 결과 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 })
    }

    const teams = await prisma.team.findMany({
      where: { scheduleId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        }
      },
      orderBy: {
        teamNumber: 'asc'
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}

// 레벨별 점수 매핑 (PRD 기준)
const levelScores = {
  PRO: 13,
  SEMI_PRO_1: 12,
  SEMI_PRO_2: 11,
  SEMI_PRO_3: 10,
  AMATEUR_1: 9,
  AMATEUR_2: 8,
  AMATEUR_3: 7,
  AMATEUR_4: 6,
  AMATEUR_5: 5,
  BEGINNER_1: 4,
  BEGINNER_2: 3,
  BEGINNER_3: 2,
  ROOKIE: 1
}

// 자동 팀편성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const { scheduleId } = await params
    const session = await auth()
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "관리자 권한이 필요합니다" }, { status: 403 })
    }

    const body = await request.json()
    const { teamCount } = body

    if (!teamCount || teamCount < 2 || teamCount > 4) {
      return NextResponse.json({ error: "팀 수는 2~4개 사이여야 합니다" }, { status: 400 })
    }

    // 일정과 참석자 정보 조회
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        attendances: {
          where: { status: 'ATTEND' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: "일정을 찾을 수 없습니다" }, { status: 404 })
    }

    const attendees = schedule.attendances

    if (attendees.length < teamCount) {
      return NextResponse.json({ error: "참석자가 팀 수보다 적습니다" }, { status: 400 })
    }

    // 기존 팀 편성 삭제
    await prisma.team.deleteMany({
      where: { scheduleId }
    })

    // 참석자를 구분: 일반 멤버와 게스트
    const regularMembers = attendees
      .filter(attendance => !attendance.guestName)
      .map(attendance => ({
        attendance,
        score: levelScores[attendance.user!.level as keyof typeof levelScores],
        name: attendance.user!.name || '이름없음',
        level: attendance.user!.level,
        isGuest: false,
        inviterId: null
      }))
      .sort((a, b) => b.score - a.score)

    const guests = attendees
      .filter(attendance => attendance.guestName)
      .map(attendance => ({
        attendance,
        score: levelScores[attendance.guestLevel as keyof typeof levelScores] || 1,
        name: attendance.guestName || '게스트',
        level: attendance.guestLevel || 'ROOKIE',
        isGuest: true,
        inviterId: attendance.userId // 초대자 ID
      }))
      .sort((a, b) => b.score - a.score)

    // 팀 초기화
    const teams = Array.from({ length: teamCount }, (_, index) => ({
      teamNumber: index + 1,
      members: [] as any[],
      totalScore: 0
    }))

    // 1단계: 일반 멤버 배정 (스네이크 드래프트)
    let currentTeamIndex = 0
    let direction = 1 // 1: 정방향, -1: 역방향

    for (const member of regularMembers) {
      teams[currentTeamIndex].members.push(member)
      teams[currentTeamIndex].totalScore += member.score

      // 다음 팀으로 이동
      if (direction === 1) {
        if (currentTeamIndex === teamCount - 1) {
          direction = -1
        } else {
          currentTeamIndex++
        }
      } else {
        if (currentTeamIndex === 0) {
          direction = 1
        } else {
          currentTeamIndex--
        }
      }
    }

    // 2단계: 게스트를 초대자와 같은 팀에 배정
    for (const guest of guests) {
      // 초대자가 있는 팀 찾기
      const inviterTeamIndex = teams.findIndex(team => 
        team.members.some(member => member.attendance.userId === guest.inviterId)
      )

      if (inviterTeamIndex !== -1) {
        // 초대자와 같은 팀에 배정
        teams[inviterTeamIndex].members.push(guest)
        teams[inviterTeamIndex].totalScore += guest.score
      } else {
        // 초대자를 찾을 수 없으면 가장 적은 점수의 팀에 배정
        const minScoreTeamIndex = teams.reduce((minIndex, team, index) => 
          team.totalScore < teams[minIndex].totalScore ? index : minIndex, 0
        )
        teams[minScoreTeamIndex].members.push(guest)
        teams[minScoreTeamIndex].totalScore += guest.score
      }
    }

    // 팀 데이터베이스에 저장
    const createdTeams = await Promise.all(
      teams.map(async (team) => {
        const createdTeam = await prisma.team.create({
          data: {
            scheduleId,
            teamNumber: team.teamNumber,
            totalScore: team.totalScore
          }
        })

        // 팀 멤버들 저장
        await Promise.all(
          team.members.map(member => 
            prisma.teamMember.create({
              data: {
                teamId: createdTeam.id,
                userId: member.attendance.user?.id,
                guestName: member.attendance.guestName,
                guestLevel: member.attendance.guestLevel,
                levelScore: member.score
              }
            })
          )
        )

        return {
          ...createdTeam,
          members: team.members
        }
      })
    )

    return NextResponse.json({ 
      message: "팀편성이 완료되었습니다",
      teams: createdTeams
    })
  } catch (error) {
    console.error("Team formation error:", error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    )
  }
}
