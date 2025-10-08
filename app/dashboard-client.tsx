"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Timer, MapPin, Clock, Check, X, Clock as ClockIcon, Edit3, Trash2, MessageCircle, Send, Share2 } from "lucide-react"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

// 타입 정의
type Level = 'PRO' | 'SEMI_PRO_1' | 'SEMI_PRO_2' | 'SEMI_PRO_3' | 'AMATEUR_1' | 'AMATEUR_2' | 'AMATEUR_3' | 'AMATEUR_4' | 'AMATEUR_5' | 'BEGINNER_1' | 'BEGINNER_2' | 'BEGINNER_3' | 'ROOKIE'
type Role = 'ADMIN' | 'MEMBER'
type AttendanceStatus = 'PENDING' | 'ATTEND' | 'ABSENT'

// Fetcher function for SWR
const fetcher = async (url: string) => {
  console.log('[Fetcher] Starting request:', url)
  
  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    console.log('[Fetcher] Response received:', { 
      url, 
      status: res.status, 
      ok: res.ok,
      statusText: res.statusText,
      headers: Object.fromEntries(res.headers.entries())
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Fetcher] Error response:', { url, status: res.status, body: errorText })
      const error = new Error(`API Error: ${res.status} ${res.statusText}`)
      throw error
    }
    
    const data = await res.json()
    console.log('[Fetcher] Success:', { url, dataKeys: Object.keys(data) })
    return data
  } catch (error) {
    console.error('[Fetcher] Network error:', { url, error })
    throw error
  }
}

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
    comments?: number
  }
  attendances: {
    id: string
    status: AttendanceStatus
    userId?: string | null
    user?: {
      id: string
      name: string | null
      realName: string | null
      level: Level
    }
    guestName?: string | null
    guestLevel?: string | null
    invitedBy?: string | null
    inviter?: {
      id: string
      name: string | null
      realName: string | null
    }
  }[]
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    level: Level
    role: Role
  }
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
    realName: string | null
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
  // SWR for dashboard data with caching
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    '/api/dashboard',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
      refreshInterval: 300000, // 5분마다 자동 갱신
    }
  )

  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestLevel, setGuestLevel] = useState('ROOKIE')
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [showTeamFormation, setShowTeamFormation] = useState(false)
  const [teamCount, setTeamCount] = useState(2)
  const [teamFormationLoading, setTeamFormationLoading] = useState(false)
  const [teams, setTeams] = useState<TeamFormation[]>([])
  const [showTeams, setShowTeams] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [showRevote, setShowRevote] = useState(false)
  const [deletingGuest, setDeletingGuest] = useState<string | null>(null)

  // 로딩 중이면 Skeleton 표시
  if (isLoading) {
    return <DashboardSkeleton />
  }

  // 에러 처리
  if (error) {
    console.error('[Dashboard] SWR Error:', error)
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 text-xl font-bold">데이터를 불러오는데 실패했습니다.</p>
        <p className="text-gray-400 text-sm">
          {error?.message || '알 수 없는 오류가 발생했습니다'}
        </p>
        <Button 
          onClick={() => {
            console.log('[Dashboard] Retrying...')
            mutate()
          }} 
          className="mt-4 bg-red-600 hover:bg-red-700"
        >
          다시 시도
        </Button>
      </div>
    )
  }

  // 데이터 없음
  if (!data) {
    console.warn('[Dashboard] No data received')
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">데이터가 없습니다.</p>
      </div>
    )
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
        // 즉시 UI 업데이트 (팀편성 숨김)
        setShowTeams(false)
        setTeams([])
        
        // 백그라운드에서 팀편성 삭제 (기다리지 않음)
        fetch(`/api/schedules/${scheduleId}/teams/clear`, {
          method: 'DELETE'
        }).catch(clearError => {
          console.error('팀편성 삭제 실패:', clearError)
        })
        
        // 피드백 먼저 표시
        alert(status === 'ATTEND' ? '참석으로 등록되었습니다!' : '불참으로 등록되었습니다!')
        
        // 데이터 새로고침 후 UI 업데이트
        await mutate()
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
        
        // 즉시 UI 업데이트
        setShowTeams(false)
        setTeams([])
        
        // 백그라운드에서 팀편성 삭제 (기다리지 않음)
        fetch(`/api/schedules/${scheduleId}/teams/clear`, {
          method: 'DELETE'
        }).catch(clearError => {
          console.error('팀편성 삭제 실패:', clearError)
        })
        
        alert('게스트 참석이 등록되었습니다!')
        
        // 백그라운드에서 데이터 새로고침
        mutate()
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
        // 대시보드 데이터도 새로고침하여 다른 사용자들도 팀편성 결과를 볼 수 있게 함
        await mutate()
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

  // 일정 수정 핸들러
  const handleEditSchedule = (scheduleId: string) => {
    window.location.href = `/admin/schedules/edit/${scheduleId}`
  }

  // 일정 삭제 핸들러
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('정말로 이 일정을 삭제하시겠습니까?\n삭제된 일정은 복구할 수 없습니다.')) {
      return
    }

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('일정이 삭제되었습니다.')
        await mutate() // 대시보드 데이터 새로고침
      } else {
        const error = await response.json()
        alert(error.error || '일정 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('일정 삭제 실패:', error)
      alert('일정 삭제 중 오류가 발생했습니다.')
    }
  }

  const fetchTeamFormation = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/teams`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
        // 팀편성 결과가 실제로 있을 때만 표시
        if (data.teams && data.teams.length > 0) {
          setShowTeams(true)
        } else {
          setShowTeams(false)
        }
      }
    } catch (error) {
      console.error('팀편성 결과 조회 실패:', error)
      setTeams([])
      setShowTeams(false)
    }
  }

  const fetchComments = async (scheduleId: string) => {
    setCommentsLoading(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('댓글 조회 실패:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const addComment = async (scheduleId: string) => {
    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요')
      return
    }

    if (newComment.trim().length > 500) {
      alert('댓글은 500자 이하로 입력해주세요')
      return
    }

    setCommentLoading(true)
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        setNewComment('')
        await fetchComments(scheduleId)
        alert('댓글이 등록되었습니다!')
      } else {
        const error = await response.json()
        alert(error.error || '댓글 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('댓글 등록 실패:', error)
      alert('댓글 등록에 실패했습니다.')
    } finally {
      setCommentLoading(false)
    }
  }

  const deleteGuestAttendance = async (attendanceId: string, guestName: string) => {
    if (!confirm(`게스트 "${guestName}"의 참석을 취소하시겠습니까?`)) {
      return
    }

    setDeletingGuest(attendanceId)
    try {
      const response = await fetch(`/api/schedules/${data?.nextSchedule?.id}/attendance/${attendanceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // 즉시 UI 업데이트
        setShowTeams(false)
        setTeams([])
        
        alert('게스트 참석이 취소되었습니다!')
        
        // 백그라운드에서 데이터 새로고침
        mutate()
      } else {
        const error = await response.json()
        alert(error.error || '게스트 참석 취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('게스트 참석 취소 실패:', error)
      alert('게스트 참석 취소에 실패했습니다.')
    } finally {
      setDeletingGuest(null)
    }
  }

  const shareTeamFormation = () => {
    if (!data?.nextSchedule || !teams || teams.length === 0) return

    // 팀 색상 이름 가져오기 함수
    const getTeamName = (teamNumber: number, totalTeams: number) => {
      if (totalTeams === 2) {
        return teamNumber === 1 ? '⚪ WHITE' : '⚫ BLACK'
      } else if (totalTeams === 3) {
        switch (teamNumber) {
          case 1: return '⚪ WHITE'
          case 2: return '⚫ BLACK'
          case 3: return '🟠 ORANGE'
          default: return `팀 ${teamNumber}`
        }
      } else {
        return `팀 ${teamNumber}`
      }
    }

    // 텍스트 포맷 생성
    let shareText = `⚽ 팀편성 결과\n`
    shareText += `📅 ${new Date(data.nextSchedule.date).toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })}\n`
    shareText += `📍 ${data.nextSchedule.location}\n`
    shareText += `━━━━━━━━━━━━━━━\n\n`

    teams.forEach((team) => {
      const teamName = getTeamName(team.teamNumber, teams.length)
      shareText += `${teamName} (${team.members.length}명)\n`
      
      const memberNames = team.members.map((member: TeamMember) => {
        const name = member.user?.realName || member.user?.name || member.guestName || '이름없음'
        return member.guestName ? `${name}(G)` : name
      })
      
      shareText += memberNames.join(', ') + '\n\n'
    })

    shareText += `━━━━━━━━━━━━━━━\n`
    shareText += `총 ${teams.reduce((acc, team) => acc + team.members.length, 0)}명 참석`

    // 클립보드에 복사
    if (navigator.clipboard && window.isSecureContext) {
      // navigator.clipboard API 사용 (HTTPS 환경)
      navigator.clipboard.writeText(shareText).then(() => {
        alert('팀편성 결과가 클립보드에 복사되었습니다.\n카카오톡에서 붙여넣기(Ctrl+V) 하세요!')
      }).catch(() => {
        // 실패 시 대체 방법 시도
        fallbackCopyTextToClipboard(shareText)
      })
    } else {
      // HTTP 환경이거나 clipboard API를 지원하지 않는 경우
      fallbackCopyTextToClipboard(shareText)
    }
  }

  // 대체 복사 방법 (구형 브라우저 및 HTTP 환경용)
  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.top = "0"
    textArea.style.left = "0"
    textArea.style.width = "2em"
    textArea.style.height = "2em"
    textArea.style.padding = "0"
    textArea.style.border = "none"
    textArea.style.outline = "none"
    textArea.style.boxShadow = "none"
    textArea.style.background = "transparent"
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        alert('팀편성 결과가 클립보드에 복사되었습니다.\n카카오톡에서 붙여넣기(Ctrl+V) 하세요!')
      } else {
        alert('복사에 실패했습니다. 텍스트를 직접 선택하여 복사해주세요.')
      }
    } catch (err) {
      console.error('복사 실패:', err)
      alert('복사에 실패했습니다. 텍스트를 직접 선택하여 복사해주세요.')
    }
    
    document.body.removeChild(textArea)
  }

  // 로딩 상태는 위에서 이미 처리됨 (Skeleton UI)

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg racing-mono">대시보드 오류</p>
      </div>
    )
  }

  const nextScheduleDate = data.nextSchedule ? new Date(data.nextSchedule.date) : null
  const daysUntil = nextScheduleDate ? Math.ceil((nextScheduleDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
  
  // 게스트 참석 가능 여부 (경기 2일 전부터)
  const canGuestJoin = daysUntil <= 2
  
  // 참석 마감 여부 (참석자가 최대 인원에 도달)
  const isFull = data.nextSchedule ? data.nextSchedule.attendances.filter(a => a.status === 'ATTEND').length >= (data.nextSchedule.maxParticipants || 15) : false

  return (
    <div className="space-y-6">
      {/* 다음 경기 메인 카드 */}
      <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-red-500/30 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-0">
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
            
            {/* 관리자 전용 일정 관리 버튼 */}
            {user.role === 'ADMIN' && data.nextSchedule && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleEditSchedule(data.nextSchedule!.id)}
                  size="sm"
                  className="bg-blue-600/80 hover:bg-blue-700 text-white"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">수정</span>
                </Button>
                <Button
                  onClick={() => handleDeleteSchedule(data.nextSchedule!.id)}
                  size="sm"
                  className="bg-red-600/80 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">삭제</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.nextSchedule ? (
            <div className="space-y-4">

              {/* 경기 기본 정보 - 모바일 최적화 */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-2xl md:text-2xl font-black mb-1">
                          {new Date(data.nextSchedule.date).toLocaleDateString('ko-KR', { 
                            month: 'long', 
                            day: 'numeric'
                          })} ({new Date(data.nextSchedule.date).toLocaleDateString('ko-KR', { 
                            weekday: 'short' 
                          })})
                        </h3>
                        {(() => {
                          const myAttendance = data.nextSchedule.attendances.find(a => a.user?.id === user.id && !a.guestName)
                          return myAttendance && !attendanceLoading && (
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              myAttendance.status === 'ATTEND' 
                                ? 'bg-green-600/20 text-green-400 border border-green-600/50' 
                                : 'bg-red-600/20 text-red-400 border border-red-600/50'
                            }`}>
                              {myAttendance.status === 'ATTEND' ? '참석 예정' : '불참 예정'}
                            </span>
                          )
                        })()}
                        {attendanceLoading && (
                          <div className="inline-block mt-1 px-2 py-1 bg-gray-600/20 text-gray-400 border border-gray-600/50 rounded-full text-xs font-semibold">
                            <div className="flex items-center">
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                              투표 중...
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <h3 className="text-2xl md:text-2xl font-black text-yellow-400">
                          {new Date(data.nextSchedule.date).toLocaleTimeString('ko-KR', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 핵심 정보만 간단히 표시 - 세로 배치 */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center space-x-3 bg-gray-900/50 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-400">장소</div>
                      <div className="text-white font-semibold text-sm">{data.nextSchedule.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 bg-gray-900/50 rounded-lg p-3">
                    <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-400">참석 인원</div>
                      <div className="text-white font-semibold text-sm">
                        {data.nextSchedule.attendances.filter(a => a.status === 'ATTEND').length}/{data.nextSchedule.maxParticipants || 15}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 간단한 진행률 바 */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (data.nextSchedule.attendances.filter(a => a.status === 'ATTEND').length / (data.nextSchedule.maxParticipants || 15)) * 100)}%` }}
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

                
              {/* 공지사항 - 상단에 별도 표시 */}
              {data.nextSchedule.description && (
                <div className="bg-gradient-to-r from-orange-900/30 to-orange-800/30 rounded-2xl p-4 border border-orange-500/50 shadow-lg">
                  <div className="flex items-start">
                    <span className="text-orange-400 text-lg mr-3 flex-shrink-0 mt-0.5">📢</span>
                    <div className="flex-1">
                      <h4 className="text-orange-300 font-bold text-sm mb-2">공지사항</h4>
                      <p className="text-orange-100 text-sm leading-relaxed whitespace-pre-wrap">{data.nextSchedule.description}</p>
                    </div>
                  </div>
                </div>
              )}
                
                {/* 참석/불참 투표 버튼 */}
                {(!data.nextSchedule.attendances.find(a => a.user?.id === user.id && !a.guestName) || showRevote) && !attendanceLoading ? (
                  // 아직 투표하지 않았거나 재투표 모드
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        updateAttendance(data.nextSchedule!.id, 'ATTEND')
                        setShowRevote(false)
                      }}
                      disabled={attendanceLoading || isFull}
                      className={`h-10 ${isFull 
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/25 transition-all duration-300'
                      } font-bold text-base rounded-xl`}
                    >
                      {attendanceLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      참석하기
                    </Button>
                    <Button
                      onClick={() => {
                        updateAttendance(data.nextSchedule!.id, 'ABSENT')
                        setShowRevote(false)
                      }}
                      disabled={attendanceLoading || isFull}
                      className={`h-10 ${isFull 
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/25 transition-all duration-300'
                      } font-bold text-base rounded-xl`}
                    >
                      {attendanceLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      불참하기
                    </Button>
                  </div>
                ) : (
                  // 이미 투표한 경우 - 재투표하기 버튼
                  <div className="text-center">
                    <Button
                      onClick={() => setShowRevote(true)}
                      disabled={attendanceLoading || isFull}
                      className={`h-10 w-full ${isFull 
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300'
                      } font-bold text-base rounded-xl`}
                    >
                      재투표하기
                    </Button>
                  </div>
                )}

                {/* 게스트 참석 버튼 (경기 2일 전부터 활성화) */}
                {canGuestJoin && !isFull && (
                  <div className="pt-0 border-t border-gray-700/50">
                    {!showGuestForm ? (
                      <>
                        <Button
                          onClick={() => setShowGuestForm(true)}
                          className="w-full h-10 bg-gradient-to-r from-yellow-600 to-yellow-600 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-md rounded-lg shadow-md hover:shadow-blue-500/25 transition-all duration-300"
                        >
                          게스트 참석 등록
                        </Button>
                        <p className="text-xs pt-2 text-gray-400 text-center mt-1">
                          경기 2일 전부터 게스트 참석 등록이 가능합니다
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
                            {attendanceLoading ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '등록'
                            )}
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
                  <div className="pt-0 border-t border-gray-700/50">
                    {!showTeamFormation ? (
                      <Button
                        onClick={() => setShowTeamFormation(true)}
                        className="w-full h-10 bg-gradient-to-r text-md from-purple-600/80 to-purple-700/80 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-md hover:shadow-purple-500/25 transition-all duration-300"
                      >
                        ⚽ 자동팀편성
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-center">
                          <p className="text-gray-300 text-sm mb-2">팀 수 선택</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[2, 3].map((count) => (
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

              {/* 참석자 명단 */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 mt-6">
                <h4 className="text-lg font-bold text-white mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-500" />
                  참석자 명단
                </h4>
                
                {data.nextSchedule.attendances.length > 0 ? (
                  <div className="space-y-3">
                    {/* 참석 예정자 - 팀원 */}
                    {data.nextSchedule.attendances.filter(a => a.status === 'ATTEND' && !a.guestName).length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                          <Check className="w-3 h-3 mr-1" />
                          팀원 참석 ({data.nextSchedule.attendances.filter(a => a.status === 'ATTEND' && !a.guestName).length}명)
                        </h5>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {data.nextSchedule.attendances
                            .filter(a => a.status === 'ATTEND' && !a.guestName)
                            .map((attendance, index) => {
                              const isMe = attendance.user?.id === user.id && !attendance.guestName
                              return (
                                <div 
                                  key={attendance.id || `attendance-${index}`} 
                                  className={`${
                                    isMe 
                                      ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 border-2 border-yellow-500/60 shadow-lg shadow-yellow-500/20' 
                                      : 'bg-green-600/20 border border-green-600/30'
                                  } rounded-lg p-2 text-center relative group cursor-pointer`}
                                >
                                  <div className={`${isMe ? 'text-yellow-300 font-bold' : 'text-white'} text-sm font-medium truncate`}>
                                    {attendance.user?.name || '이름없음'}
                                  </div>
                                  {isMe && (
                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}

                    {/* 참석 예정자 - 게스트 */}
                    {data.nextSchedule.attendances.filter(a => a.status === 'ATTEND' && a.guestName).length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-400 mb-2 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          게스트 참석 ({data.nextSchedule.attendances.filter(a => a.status === 'ATTEND' && a.guestName).length}명)
                        </h5>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {data.nextSchedule.attendances
                            .filter(a => a.status === 'ATTEND' && a.guestName)
                            .map((attendance, index) => {
                              const inviterName = attendance.inviter ? attendance.inviter.name : '알 수 없음'
                              return (
                                <div 
                                  key={attendance.id || `guest-attendance-${index}`} 
                                  className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-2 text-center relative group cursor-pointer"
                                >
                                  <div className="text-white text-sm font-medium truncate">
                                    {attendance.guestName}
                                  </div>
                                  {inviterName && (
                                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                                      ({inviterName})
                                    </div>
                                  )}
                                  <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0 rounded-full font-bold w-4 h-4 flex items-center justify-center">
                                    G
                                  </Badge>
                                  {/* 게스트 삭제 버튼 - 관리자 또는 초대자만 */}
                                  {(user.role === 'ADMIN' || attendance.invitedBy === user.id) && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteGuestAttendance(attendance.id, attendance.guestName!)
                                      }}
                                      disabled={deletingGuest === attendance.id}
                                      className="absolute -top-1 -left-1 w-5 h-5 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg z-20 border border-white"
                                      title="게스트 참석 취소"
                                    >
                                      {deletingGuest === attendance.id ? (
                                        <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                        <Trash2 className="w-2.5 h-2.5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )
                            })}
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
                        <div className="grid grid-cols-3 gap-2">
                          {data.nextSchedule.attendances
                            .filter(a => a.status === 'ABSENT')
                            .map((attendance, index) => {
                              const isMe = attendance.user?.id === user.id && !attendance.guestName
                              const isGuest = !!attendance.guestName
                              const inviterName = isGuest && attendance.user ? attendance.user.name : null
                              return (
                                <div 
                                  key={attendance.id || `attendance-absent-${index}`} 
                                  className={`${
                                    isMe 
                                      ? 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 border-2 border-yellow-500/60 shadow-lg shadow-yellow-500/20' 
                                      : 'bg-red-600/20 border border-red-600/30'
                                  } rounded-lg p-2 text-center relative group cursor-pointer`}
                                >
                                  <div className={`${isMe ? 'text-yellow-300 font-bold' : 'text-white'} text-sm font-medium truncate`}>
                                    {attendance.guestName || attendance.user?.name || '이름없음'}
                                  </div>
                                  {isGuest && inviterName && (
                                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                                      ({inviterName} 지인)
                                    </div>
                                  )}
                                  {attendance.guestName && (
                                    <>
                                      <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0 rounded-full font-bold w-4 h-4 flex items-center justify-center">
                                        G
                                      </Badge>
                                      {/* 게스트 삭제 버튼 - 관리자 또는 초대자만 */}
                                      {(user.role === 'ADMIN' || attendance.invitedBy === user.id) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            deleteGuestAttendance(attendance.id, attendance.guestName!)
                                          }}
                                          disabled={deletingGuest === attendance.id}
                                          className="absolute -top-1 -left-1 w-5 h-5 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg z-20 border border-white"
                                          title="게스트 참석 취소"
                                        >
                                          {deletingGuest === attendance.id ? (
                                            <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                                          ) : (
                                            <Trash2 className="w-2.5 h-2.5" />
                                          )}
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {isMe && (
                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              )
                            })}
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
                            .map((attendance, index) => {
                              const isMe = attendance.user?.id === user.id && !attendance.guestName
                              return (
                                <div 
                                  key={attendance.id || `attendance-pending-${index}`} 
                                  className={`${
                                    isMe 
                                      ? 'bg-gradient-to-r from-yellow-600/40 to-yellow-500/40 border-2 border-yellow-500/70 shadow-lg shadow-yellow-500/20' 
                                      : 'bg-yellow-600/20 border border-yellow-600/30'
                                  } rounded-lg p-2 text-center relative group cursor-pointer`}
                                >
                                  <div className={`${isMe ? 'text-yellow-200 font-bold' : 'text-white'} text-xs font-medium truncate`}>
                                    {attendance.guestName || attendance.user?.name || '이름없음'}
                                  </div>
                                  {attendance.guestName && (
                                    <>
                                      <Badge className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs px-1 py-0 rounded-full font-bold w-4 h-4 flex items-center justify-center">
                                        G
                                      </Badge>
                                      {/* 게스트 삭제 버튼 - 관리자 또는 초대자만 */}
                                      {(user.role === 'ADMIN' || attendance.invitedBy === user.id) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            deleteGuestAttendance(attendance.id, attendance.guestName!)
                                          }}
                                          disabled={deletingGuest === attendance.id}
                                          className="absolute -top-1 -left-1 w-5 h-5 bg-red-600/90 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg z-20 border border-white"
                                          title="게스트 참석 취소"
                                        >
                                          {deletingGuest === attendance.id ? (
                                            <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                                          ) : (
                                            <Trash2 className="w-2.5 h-2.5" />
                                          )}
                                        </button>
                                      )}
                                    </>
                                  )}
                                  {isMe && (
                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse"></div>
                                  )}
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4 text-sm">아직 참석 응답이 없습니다</p>
                )}
              </div>

              {/* 댓글 섹션 */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-white flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    Comments
                    {comments.length > 0 && (
                      <span className="ml-2 text-sm text-gray-400">({comments.length})</span>
                    )}
                  </h4>
                  <Button
                    onClick={() => {
                      if (!showComments) {
                        fetchComments(data.nextSchedule!.id)
                      }
                      setShowComments(!showComments)
                    }}
                    className="text-xs px-3 py-1 bg-gray-600/50 text-gray-300 hover:bg-gray-600 hover:text-white rounded"
                  >
                    {showComments ? '닫기' : `댓글 보기${data.nextSchedule._count.comments ? ` (${data.nextSchedule._count.comments})` : ''}`}
                  </Button>
                </div>

                {showComments && (
                  <div className="space-y-4">
                    {/* 댓글 작성 */}
                    <div className="space-y-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="경기에 대한 의견이나 질문을 남겨주세요... (500자 이내)"
                        maxLength={500}
                        className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:border-green-500 text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {newComment.length}/500자
                        </span>
                        <Button
                          onClick={() => addComment(data.nextSchedule!.id)}
                          disabled={commentLoading || !newComment.trim()}
                          className="h-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          {commentLoading ? '등록중...' : '댓글 등록'}
                        </Button>
                      </div>
                    </div>

                    {/* 댓글 목록 */}
                    <div className="border-t border-gray-700/50 pt-4">
                      {commentsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : comments.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-white font-medium text-sm">
                                    {comment.user.name || '이름없음'}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.createdAt).toLocaleDateString('ko-KR', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* 팀편성 결과 - 댓글 아래로 이동 */}
              {showTeams && teams.length > 0 && (
                <div className="bg-gradient-to-br from-purple-900/70 to-purple-800/70 border-purple-500/20 backdrop-blur-sm shadow-lg rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-white flex items-center">
                      ⚽ 팀편성 결과
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        onClick={shareTeamFormation}
                        className="text-xs px-2 py-1 bg-blue-600/50 text-blue-300 hover:bg-blue-600 hover:text-white rounded flex items-center"
                      >
                        <Share2 className="w-3 h-3 mr-1" />
                        공유
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
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
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`text-lg font-bold ${teamColor.text}`}>
                              {teamColor.name}
                            </h4>
                            <div className={`text-sm ${teamColor.text} opacity-80`}>
                              {team.members.length}명
                            </div>
                          </div>
                          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
                            {team.members.map((member: TeamMember) => (
                              <div key={member.id} className={`${teamColor.text === 'text-black' ? 'bg-gray-200/50' : 'bg-gray-700/50'} rounded-lg p-2 text-center`}>
                                <span className={`text-xs font-semibold ${teamColor.text} block truncate`}>
                                  {member.user?.name || member.guestName}
                                  {member.guestName && <span className={`block text-xs ${teamColor.text === 'text-black' ? 'text-gray-600' : 'text-gray-400'}`}>(게스트)</span>}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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
                         <div className="flex items-center justify-between">
                           <h4 className="text-sm font-semibold text-white mb-1">
                             {schedule.title}
                           </h4>
                           {/* 관리자 전용 수정/삭제 버튼 */}
                           {user.role === 'ADMIN' && (
                             <div className="flex items-center space-x-1">
                               <button
                                 onClick={() => handleEditSchedule(schedule.id)}
                                 className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded transition-all duration-200"
                                 title="수정"
                               >
                                 <Edit3 className="w-3 h-3" />
                               </button>
                               <button
                                 onClick={() => handleDeleteSchedule(schedule.id)}
                                 className="p-1 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-all duration-200"
                                 title="삭제"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </div>
                           )}
                         </div>
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

    </div>
  )
}


