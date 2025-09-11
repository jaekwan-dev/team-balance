import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Level } from "@prisma/client"

// Node.js 런타임 사용 (Prisma 호환성)
export const runtime = 'nodejs'

// 팀편성용 참석자 타입
interface TeamAttendee {
  attendance: {
    id: string
    userId: string | null
    guestName: string | null
    guestLevel: string | null
    status: string
  }
  score: number
  name: string
  level: string
  isGuest: boolean
  inviterId: string | null
}

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

    // 최소 팀당 인원수와 추가 배정될 인원 계산
    const basePlayersPerTeam = Math.floor(attendees.length / teamCount)
    const extraPlayers = attendees.length % teamCount
    
    console.log(`팀편성: ${attendees.length}명을 ${teamCount}팀으로 배정`)
    console.log(`기본 인원: 팀당 ${basePlayersPerTeam}명, 추가 배정: ${extraPlayers}명`)

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
      members: [] as TeamAttendee[],
      totalScore: 0
    }))

    // 전체 참석자를 하나로 합치고 레벨별로 정렬 (타입 통일)
    const allAttendees: TeamAttendee[] = [...regularMembers, ...guests]
      .sort((a, b) => b.score - a.score)

    // 1단계: 스네이크 드래프트로 기본 인원 배정 (각 팀에 basePlayersPerTeam명씩)
    let currentTeamIndex = 0
    let direction = 1 // 1: 정방향, -1: 역방향
    let assignedCount = 0

    // 기본 인원 배정 (모든 팀에 같은 수)
    const totalBaseAssignment = basePlayersPerTeam * teamCount
    
    for (let i = 0; i < totalBaseAssignment; i++) {
      const attendee = allAttendees[assignedCount]
      
      teams[currentTeamIndex].members.push(attendee)
      teams[currentTeamIndex].totalScore += attendee.score
      assignedCount++

      // 다음 팀으로 이동 (스네이크 패턴)
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

    // 2단계: 추가 인원이 있으면 평균 점수가 낮은 팀에 배정
    if (extraPlayers > 0) {
      // 각 팀의 평균 점수 계산
      const teamsWithAverage = teams.map((team, index) => ({
        index,
        averageScore: team.members.length > 0 ? team.totalScore / team.members.length : 0,
        currentMembers: team.members.length
      })).sort((a, b) => a.averageScore - b.averageScore) // 평균 점수가 낮은 순으로 정렬

      console.log('기본 배정 후 각 팀 평균:', teamsWithAverage.map(t => 
        `팀${t.index + 1}: ${t.averageScore.toFixed(2)}점 (${t.currentMembers}명)`
      ))

      // 평균 점수가 낮은 팀부터 추가 인원 배정
      for (let i = 0; i < extraPlayers; i++) {
        const attendee = allAttendees[assignedCount]
        const targetTeamIndex = teamsWithAverage[i].index
        
        teams[targetTeamIndex].members.push(attendee)
        teams[targetTeamIndex].totalScore += attendee.score
        assignedCount++
        
        console.log(`추가 배정: ${attendee.name} -> 팀${targetTeamIndex + 1}`)
      }
      
      // 최종 팀별 인원 수 출력
      teams.forEach((team, index) => {
        console.log(`팀${index + 1}: ${team.members.length}명 (평균: ${(team.totalScore / team.members.length).toFixed(2)}점)`)
      })
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
                userId: member.isGuest ? null : member.attendance.userId,
                guestName: member.isGuest ? member.name : null,
                guestLevel: member.isGuest ? member.level as Level : null,
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
