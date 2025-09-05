"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Timer, MapPin, Clock, Check, X, Clock as ClockIcon } from "lucide-react"
import { Level, Role, AttendanceStatus } from "@prisma/client"

interface DashboardUser {
  id: string
  name?: string | null
  level: Level
  role: Role
}

interface Schedule {
  id: string
  title: string
  date: string
  location: string
  description: string | null
  maxParticipants: number | null
  _count: {
    attendances: number
  }
  attendances: {
    status: AttendanceStatus
    user?: {
      id: string
      name: string | null
      level: Level
    }
    guestName?: string | null
    guestLevel?: string | null
  }[]
}

interface RecentActivity {
  id: string
  title: string
  date: string
  location: string
  attendances: {
    status: AttendanceStatus
  }[]
  _count: {
    attendances: number
  }
}

interface TeamMember {
  id: string
  user?: {
    id: string
    name: string | null
    level: Level
  }
  guestName?: string | null
  guestLevel?: string | null
  levelScore: number
}

interface TeamFormation {
  id: string
  teamNumber: number
  totalScore: number
  members: TeamMember[]
}

interface DashboardData {
  nextSchedule: Schedule | null
  upcomingSchedules: Schedule[]
  attendanceRate: number
  totalAttendances: number
  attendedCount: number
  recentActivities: RecentActivity[]
  stats: {
    totalMembers: number
    totalSchedules: number
    myAttendances: number
  }
}


const statusColors = {
  ATTEND: "bg-green-600 text-white",
  ABSENT: "bg-red-600 text-white",
  PENDING: "bg-yellow-600 text-black"
}

const statusLabels = {
  ATTEND: "참석",
  ABSENT: "불참",
  PENDING: "대기"
}

export function DashboardClient({ user }: { user: DashboardUser }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestLevel, setGuestLevel] = useState('ROOKIE')
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [showTeamFormation, setShowTeamFormation] = useState(false)
  const [teamCount, setTeamCount] = useState(2)
  const [teamFormationLoading, setTeamFormationLoading] = useState(false)
  const [teams, setTeams] = useState<TeamFormation[]>([])
  const [showTeams, setShowTeams] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    // 다음 경기의 팀편성 결과가 있는지 확인
    if (data?.nextSchedule?.id) {
      fetchTeamFormation(data.nextSchedule.id)
    }
  }, [data?.nextSchedule?.id])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const dashboardData: DashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAttendance = async (scheduleId: string, status: AttendanceStatus) => {
    setAttendanceLoading(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        // 대시보드 데이터 새로고침
        await fetchDashboardData()
        alert(status === 'ATTEND' ? '참석으로 등록되었습니다!' : '불참으로 등록되었습니다!')
      } else {
        const error = await response.json()
        alert(error.error || '참석 상태 업데이트에 실패했습니다')
      }
    } catch (error) {
      console.error('Attendance update error:', error)
      alert('참석 상태 업데이트 중 오류가 발생했습니다')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const addGuestAttendance = async (scheduleId: string) => {
    if (!guestName.trim()) {
      alert('게스트 이름을 입력해주세요')
      return
    }

    setAttendanceLoading(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'ATTEND',
          guestName: guestName.trim(),
          guestLevel: guestLevel
        }),
      })

      if (response.ok) {
        // 폼 리셋
        setGuestName('')
        setGuestLevel('ROOKIE')
        setShowGuestForm(false)
        // 대시보드 데이터 새로고침
        await fetchDashboardData()
        alert('게스트 참석이 등록되었습니다!')
      } else {
        alert('게스트 참석 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('게스트 참석 등록 실패:', error)
      alert('게스트 참석 등록에 실패했습니다')
    } finally {
      setAttendanceLoading(false)
    }
  }

  const createTeamFormation = async (scheduleId: string) => {
    setTeamFormationLoading(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamCount }),
      })

      if (response.ok) {
        setShowTeamFormation(false)
        alert(`${teamCount}팀으로 팀편성이 완료되었습니다!`)
        // 팀편성 결과 가져오기
        await fetchTeamFormation(scheduleId)
      } else {
        const error = await response.json()
        alert(error.error || '팀편성에 실패했습니다')
      }
    } catch (error) {
      console.error('팀편성 실패:', error)
      alert('팀편성 중 오류가 발생했습니다')
    } finally {
      setTeamFormationLoading(false)
    }
  }

  const fetchTeamFormation = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/teams`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams)
        setShowTeams(true)
      }
    } catch (error) {
      console.error('팀편성 결과 조회 실패:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 racing-mono">대시보드 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg racing-mono">대시보드 오류</p>
      </div>
    )
  }

  const nextScheduleDate = data.nextSchedule ? new Date(data.nextSchedule.date) : null
  const isToday = nextScheduleDate ? nextScheduleDate.toDateString() === new Date().toDateString() : false
  const daysUntil = nextScheduleDate ? Math.ceil((nextScheduleDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
  
  // 게스트 참석 가능 여부 (경기 2일 전부터)
  const canGuestJoin = daysUntil <= 2
  
  // 참석 마감 여부 (참석자가 최대 인원에 도달)
  const isFull = data.nextSchedule ? data.nextSchedule._count.attendances >= (data.nextSchedule.maxParticipants || 15) : false

  return (
    <div className="space-y-6">
      {/* 다음 경기 메인 카드 */}
      <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-red-500/30 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-white">다음 경기</CardTitle>
                <p className="text-gray-400 text-sm">Next Match Details</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.nextSchedule ? (
            <div className="space-y-4">
              {/* 경기 기본 정보 - 모바일 최적화 */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-black text-white mb-1">
                      {isToday ? '🔥 오늘 경기!' : `${daysUntil}일 후`}
                    </h3>
                    <p className="text-base md:text-lg text-gray-300">{data.nextSchedule.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl md:text-4xl font-black text-red-500">
                      {new Date(data.nextSchedule.date).getHours()}:{String(new Date(data.nextSchedule.date).getMinutes()).padStart(2, '0')}
                    </div>
                  </div>
                </div>
                
                {/* 핵심 정보만 간단히 표시 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-yellow-500" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-400">장소</div>
                      <div className="text-white font-semibold text-sm truncate">{data.nextSchedule.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-900/50 rounded-lg p-3">
                    <Users className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-gray-400">참석률</div>
                      <div className="text-white font-semibold text-sm">
                        {data.nextSchedule._count.attendances}/{data.nextSchedule.maxParticipants || 15}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 간단한 진행률 바 */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (data.nextSchedule._count.attendances / (data.nextSchedule.maxParticipants || 15)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 참석 상태 및 버튼 - 상단으로 이동 */}
              <div className="space-y-3">
                {/* 참석 마감 상태 표시 */}
                {isFull && (
                  <div className="text-center">
                    <Badge className="bg-red-600 text-white text-sm px-4 py-2 rounded-full font-semibold">
                      🚫 참석이 마감되었습니다
                    </Badge>
                  </div>
                )}
                
                {/* 현재 참석 상태 */}
                {data.nextSchedule.attendances.find(a => a.user?.id === user.id) && (
                  <div className="text-center">
                    <Badge className={`${statusColors[data.nextSchedule.attendances.find(a => a.user?.id === user.id)!.status]} text-sm px-4 py-2 rounded-full font-semibold`}>
                      현재 상태: {statusLabels[data.nextSchedule.attendances.find(a => a.user?.id === user.id)!.status]}
                    </Badge>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => updateAttendance(data.nextSchedule!.id, 'ATTEND')}
                    disabled={attendanceLoading || isFull}
                    className={`h-12 ${isFull 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300'
                    } font-bold text-base rounded-xl`}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    참석하기
                  </Button>
                  <Button
                    onClick={() => updateAttendance(data.nextSchedule!.id, 'ABSENT')}
                    disabled={attendanceLoading || isFull}
                    className={`h-12 ${isFull 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/25 transition-all duration-300'
                    } font-bold text-base rounded-xl`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    불참하기
                  </Button>
                </div>

                {/* 게스트 참석 버튼 (경기 2일 전부터 활성화) */}
                {canGuestJoin && !isFull && (
                  <div className="pt-2 border-t border-gray-700/50">
                    {!showGuestForm ? (
                      <>
                        <Button
                          onClick={() => setShowGuestForm(true)}
                          className="w-full h-10 bg-gradient-to-r from-blue-600/80 to-blue-700/80 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-blue-500/25 transition-all duration-300"
                        >
                          👥 게스트 참석 신청
                        </Button>
                        <p className="text-xs text-gray-400 text-center mt-1">
                          경기 2일 전부터 게스트 참석이 가능합니다
                        </p>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="게스트 이름"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 text-sm"
                          />
                          <select
                            value={guestLevel}
                            onChange={(e) => setGuestLevel(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:border-blue-500 text-sm"
                          >
                            <option value="PRO">프로</option>
                            <option value="SEMI_PRO_1">세미프로 1</option>
                            <option value="SEMI_PRO_2">세미프로 2</option>
                            <option value="SEMI_PRO_3">세미프로 3</option>
                            <option value="AMATEUR_1">아마추어 1</option>
                            <option value="AMATEUR_2">아마추어 2</option>
                            <option value="AMATEUR_3">아마추어 3</option>
                            <option value="AMATEUR_4">아마추어 4</option>
                            <option value="AMATEUR_5">아마추어 5</option>
                            <option value="BEGINNER_1">비기너 1</option>
                            <option value="BEGINNER_2">비기너 2</option>
                            <option value="BEGINNER_3">비기너 3</option>
                            <option value="ROOKIE">루키</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => addGuestAttendance(data.nextSchedule!.id)}
                            disabled={attendanceLoading}
                            className="h-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-xs rounded-lg"
                          >
                            등록
                          </Button>
                          <Button
                            onClick={() => {
                              setShowGuestForm(false)
                              setGuestName('')
                              setGuestLevel('ROOKIE')
                            }}
                            className="h-8 bg-gray-600/50 text-gray-300 hover:bg-gray-600 hover:text-white font-semibold text-xs rounded-lg"
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 관리자 전용 팀편성 기능 */}
                {user.role === 'ADMIN' && data.nextSchedule._count.attendances >= 4 && (
                  <div className="pt-3 border-t border-gray-700/50">
                    {!showTeamFormation ? (
                      <Button
                        onClick={() => setShowTeamFormation(true)}
                        className="w-full h-10 bg-gradient-to-r from-purple-600/80 to-purple-700/80 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-purple-500/25 transition-all duration-300"
                      >
                        ⚽ 자동 팀편성
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-gray-300 text-sm mb-2">팀 수 선택</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[2, 3, 4].map((count) => (
                              <button
                                key={count}
                                onClick={() => setTeamCount(count)}
                                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                  teamCount === count
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                                }`}
                              >
                                {count}팀
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => createTeamFormation(data.nextSchedule!.id)}
                            disabled={teamFormationLoading}
                            className="h-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold text-xs rounded-lg"
                          >
                            {teamFormationLoading ? '편성중...' : '편성하기'}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowTeamFormation(false)
                              setTeamCount(2)
                            }}
                            className="h-8 bg-gray-600/50 text-gray-300 hover:bg-gray-600 hover:text-white font-semibold text-xs rounded-lg"
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 참석자 명단 - 하단으로 이동 */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 mt-6">
                <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-500" />
                  참석자 명단
                </h4>
                
                {data.nextSchedule.attendances.length > 0 ? (
                  <div className="space-y-3">
                    {/* 참석 예정자 */}
                    {data.nextSchedule.attendances.filter(a => a.status === 'ATTEND').length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          참석 예정 ({data.nextSchedule.attendances.filter(a => a.status === 'ATTEND').length}명)
                        </h5>
                        <div className="grid grid-cols-4 gap-2">
                          {data.nextSchedule.attendances
                            .filter(a => a.status === 'ATTEND')
                            .map((attendance, index) => (
                              <div key={attendance.user?.id || `guest-${index}`} className="bg-green-600/20 border border-green-600/30 rounded-lg p-2 text-center relative group cursor-pointer">
                                <div className="text-white text-xs font-medium truncate">
                                  {attendance.user?.name || attendance.guestName || '이름없음'}
                                </div>
                                {attendance.guestName && (
                                  <>
                                    <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0 rounded-full font-bold w-4 h-4 flex items-center justify-center">
                                      G
                                    </Badge>
                                    {/* 툴팁 - 초대한 사람 표시 */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                      게스트 참석자
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 불참자 */}
                    {data.nextSchedule.attendances.filter(a => a.status === 'ABSENT').length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-red-400 mb-2 flex items-center">
                          <X className="w-3 h-3 mr-1" />
                          불참 ({data.nextSchedule.attendances.filter(a => a.status === 'ABSENT').length}명)
                        </h5>
                        <div className="grid grid-cols-4 gap-2">
                          {data.nextSchedule.attendances
                            .filter(a => a.status === 'ABSENT')
                            .map((attendance, index) => (
                              <div key={attendance.user?.id || `guest-absent-${index}`} className="bg-red-600/20 border border-red-600/30 rounded-lg p-2 text-center relative group cursor-pointer">
                                <div className="text-white text-xs font-medium truncate">
                                  {attendance.user?.name || attendance.guestName || '이름없음'}
                                </div>
                                {attendance.guestName && (
                                  <>
                                    <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0 rounded-full font-bold w-4 h-4 flex items-center justify-center">
                                      G
                                    </Badge>
                                    {/* 툴팁 - 초대한 사람 표시 */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                      게스트 참석자
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 대기중 */}
                    {data.nextSchedule.attendances.filter(a => a.status === 'PENDING').length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          응답 대기 ({data.nextSchedule.attendances.filter(a => a.status === 'PENDING').length}명)
                        </h5>
                        <div className="grid grid-cols-4 gap-2">
                          {data.nextSchedule.attendances
                            .filter(a => a.status === 'PENDING')
                            .map((attendance, index) => (
                              <div key={attendance.user?.id || `guest-pending-${index}`} className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-2 text-center relative group cursor-pointer">
                                <div className="text-white text-xs font-medium truncate">
                                  {attendance.user?.name || attendance.guestName || '이름없음'}
                                </div>
                                {attendance.guestName && (
                                  <>
                                    <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0 rounded-full font-bold w-4 h-4 flex items-center justify-center">
                                      G
                                    </Badge>
                                    {/* 툴팁 - 초대한 사람 표시 */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                      게스트 참석자
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4 text-sm">아직 참석 응답이 없습니다</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="w-12 h-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">경기 일정 대기중</h3>
              <p className="text-gray-400">곧 새로운 경기가 등록될 예정입니다</p>
            </div>
          )}
          </CardContent>
        </Card>

        {/* 이후 경기 일정 - 간소화된 표시 */}
        {data.upcomingSchedules && data.upcomingSchedules.length > 0 && (
          <Card className="bg-gradient-to-br from-gray-900/70 to-black/70 border-gray-500/20 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-white flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                이후 경기 일정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingSchedules.map((schedule) => {
                const scheduleDate = new Date(schedule.date)
                const daysUntil = Math.ceil((scheduleDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                const userAttendance = schedule.attendances[0]
                
                return (
                  <div key={schedule.id} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-white mb-1">
                          {schedule.title}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          <span>{daysUntil}일 후</span>
                          <span className="flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {schedule.location}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {schedule._count.attendances}명
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-300">
                          {scheduleDate.getHours()}:{String(scheduleDate.getMinutes()).padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {scheduleDate.toLocaleDateString('ko-KR', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* 간단한 참석 투표 버튼 */}
                    <div className="flex items-center justify-between">
                      {userAttendance && (
                        <Badge className={`${statusColors[userAttendance.status]} text-xs px-2 py-1 rounded font-semibold`}>
                          {statusLabels[userAttendance.status]}
                        </Badge>
                      )}
                      <div className="flex space-x-2 ml-auto">
                        <button
                          onClick={() => updateAttendance(schedule.id, 'ATTEND')}
                          disabled={attendanceLoading}
                          className="px-3 py-1 bg-green-600/20 border border-green-600/50 text-green-400 hover:bg-green-600 hover:text-white transition-all duration-300 text-xs rounded font-semibold"
                        >
                          참석
                        </button>
                        <button
                          onClick={() => updateAttendance(schedule.id, 'ABSENT')}
                          disabled={attendanceLoading}
                          className="px-3 py-1 bg-red-600/20 border border-red-600/50 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 text-xs rounded font-semibold"
                        >
                          불참
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* 팀편성 결과 */}
        {showTeams && teams.length > 0 && (
          <Card className="bg-gradient-to-br from-purple-900/70 to-purple-800/70 border-purple-500/20 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white flex items-center">
                  ⚽ 팀편성 결과
                </CardTitle>
                <Button
                  onClick={() => setShowTeams(false)}
                  className="text-xs px-2 py-1 bg-gray-600/50 text-gray-300 hover:bg-gray-600 hover:text-white rounded"
                >
                  닫기
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => {
                  // 팀 색상 정의
                  const getTeamColor = (teamNumber: number, totalTeams: number) => {
                    if (totalTeams === 2) {
                      return teamNumber === 1 
                        ? { bg: 'bg-gray-100', text: 'text-black', border: 'border-gray-300', name: 'WHITE' }
                        : { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-700', name: 'BLACK' }
                    } else if (totalTeams === 3) {
                      switch (teamNumber) {
                        case 1: return { bg: 'bg-gray-100', text: 'text-black', border: 'border-gray-300', name: 'WHITE' }
                        case 2: return { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-700', name: 'BLACK' }
                        case 3: return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600', name: 'ORANGE' }
                        default: return { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-600', name: `TEAM ${teamNumber}` }
                      }
                    } else {
                      // 4팀 이상은 기본 색상
                      return { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-600', name: `TEAM ${teamNumber}` }
                    }
                  }

                  const teamColor = getTeamColor(team.teamNumber, teams.length)

                  return (
                    <div key={team.id} className={`${teamColor.bg} rounded-xl p-4 border-2 ${teamColor.border} shadow-lg`}>
                      <div className="text-center mb-3">
                        <h4 className={`text-lg font-bold mb-1 ${teamColor.text}`}>
                          {teamColor.name}
                        </h4>
                        <div className={`text-sm ${teamColor.text} opacity-80`}>
                          {team.members.length}명
                        </div>
                      </div>
                      <div className="space-y-2">
                        {team.members.map((member: TeamMember) => (
                          <div key={member.id} className={`${teamColor.text === 'text-black' ? 'bg-gray-200/50' : 'bg-gray-700/50'} rounded-lg p-2 text-center`}>
                            <span className={`text-sm font-semibold ${teamColor.text} flex items-center justify-center`}>
                              {member.user?.name || member.guestName}
                              {member.guestName && <span className="ml-1 text-blue-500 text-xs">👥</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}


