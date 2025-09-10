"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Trophy, Calendar, MapPin, TrendingUp, Check, X, Users } from "lucide-react"
import { Level, Role, AttendanceStatus } from "@prisma/client"

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  level: Level
  role: Role
  phone: string | null
  isProfileComplete: boolean
  createdAt: string
  attendances: {
    id: string
    status: AttendanceStatus
    createdAt: string
    schedule: {
      title: string
      date: string
      location: string
    }
  }[]
  teamMembers: {
    id: string
    levelScore: number
    team: {
      teamNumber: number
      totalScore: number
      schedule: {
        title: string
        date: string
      }
    }
  }[]
}

interface ApiResponse {
  user: UserProfile
}

const levelLabels: Record<Level, string> = {
  PRO: "프로",
  SEMI_PRO_1: "세미프로 1",
  SEMI_PRO_2: "세미프로 2", 
  SEMI_PRO_3: "세미프로 3",
  AMATEUR_1: "아마추어 1",
  AMATEUR_2: "아마추어 2",
  AMATEUR_3: "아마추어 3",
  AMATEUR_4: "아마추어 4",
  AMATEUR_5: "아마추어 5",
  BEGINNER_1: "비기너 1",
  BEGINNER_2: "비기너 2",
  BEGINNER_3: "비기너 3",
  ROOKIE: "루키"
}

const levelColors: Record<Level, string> = {
  PRO: "bg-gradient-to-r from-purple-600 to-purple-800",
  SEMI_PRO_1: "bg-gradient-to-r from-blue-600 to-blue-800",
  SEMI_PRO_2: "bg-gradient-to-r from-blue-500 to-blue-700",
  SEMI_PRO_3: "bg-gradient-to-r from-blue-400 to-blue-600",
  AMATEUR_1: "bg-gradient-to-r from-green-600 to-green-800",
  AMATEUR_2: "bg-gradient-to-r from-green-500 to-green-700",
  AMATEUR_3: "bg-gradient-to-r from-green-400 to-green-600",
  AMATEUR_4: "bg-gradient-to-r from-yellow-600 to-yellow-800",
  AMATEUR_5: "bg-gradient-to-r from-yellow-500 to-yellow-700",
  BEGINNER_1: "bg-gradient-to-r from-orange-600 to-orange-800",
  BEGINNER_2: "bg-gradient-to-r from-orange-500 to-orange-700",
  BEGINNER_3: "bg-gradient-to-r from-red-500 to-red-700",
  ROOKIE: "bg-gradient-to-r from-gray-600 to-gray-800"
}

const statusColors: Record<AttendanceStatus, string> = {
  ATTEND: "bg-green-600 text-white",
  ABSENT: "bg-red-600 text-white",
  PENDING: "bg-yellow-600 text-black"
}

const statusLabels: Record<AttendanceStatus, string> = {
  ATTEND: "참석",
  ABSENT: "불참",
  PENDING: "대기"
}

export function ProfileClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/profile?userId=${userId}`)
        if (response.ok) {
          const data: ApiResponse = await response.json()
          setUser(data.user)
        } else {
          const errorData = await response.json()
          console.error('API Error:', response.status, errorData)
          setError(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [userId])


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-red-400 text-lg font-semibold">프로필 로드 실패</div>
        <div className="text-gray-400 text-sm">{error}</div>
        <button 
          onClick={() => {
            setError(null)
            setLoading(true)
            // 다시 시도
            const fetchUser = async () => {
              try {
                const response = await fetch(`/api/user/profile?userId=${userId}`)
                if (response.ok) {
                  const data: ApiResponse = await response.json()
                  setUser(data.user)
                } else {
                  const errorData = await response.json()
                  setError(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`)
                }
              } catch (error) {
                setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
              } finally {
                setLoading(false)
              }
            }
            fetchUser()
          }}
          className="px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">사용자를 찾을 수 없습니다</p>
      </div>
    )
  }

  const attendanceRate = user.attendances.length > 0 
    ? Math.round((user.attendances.filter(a => a.status === 'ATTEND').length / user.attendances.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* 프로필 헤더 */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-800/20 rounded-3xl blur-xl"></div>
        <Card className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border-red-500/30 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
              {/* 프로필 아바타 */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-2xl">
                  <User className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center border-4 border-gray-900">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* 프로필 정보 */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                    {user.name || "이름 없음"}
                  </h1>
                  <p className="text-xl text-gray-300">
                    PPUNGBROS 멤버 • {new Date(user.createdAt).toLocaleDateString('ko-KR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} 가입
                  </p>
                </div>
                
                {/* 배지들 */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                  <Badge className={`${levelColors[user.level]} text-white font-bold px-4 py-2 text-lg rounded-full shadow-lg`}>
                    {levelLabels[user.level]}
                  </Badge>
                  {user.role === 'ADMIN' && (
                    <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-bold px-4 py-2 text-lg rounded-full shadow-lg">
                      👑 관리자
                    </Badge>
                  )}
                </div>
                
                {/* 연락처 정보 */}
                {(user.email || user.phone) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.email && (
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <div className="text-sm text-gray-400 mb-1">이메일</div>
                        <div className="text-white font-semibold">{user.email}</div>
                      </div>
                    )}
                    {user.phone && (
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <div className="text-sm text-gray-400 mb-1">연락처</div>
                        <div className="text-white font-semibold">{user.phone}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 선수 통계 - 확장된 버전 */}
      <div className="space-y-6">
        {/* 메인 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-500">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-blue-400 mb-2">{user.attendances.length}</div>
              <h3 className="text-lg font-bold text-white mb-1">총 경기</h3>
              <p className="text-blue-400 text-sm">Total Matches</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30 backdrop-blur-sm hover:border-green-400/50 transition-all duration-500">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-green-400 mb-2">
                {user.attendances.filter(a => a.status === 'ATTEND').length}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">참석</h3>
              <p className="text-green-400 text-sm">Attended</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 backdrop-blur-sm hover:border-red-400/50 transition-all duration-500">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-red-400 mb-2">
                {user.attendances.filter(a => a.status === 'ABSENT').length}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">불참</h3>
              <p className="text-red-400 text-sm">Absent</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all duration-500">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-yellow-400 mb-2">{attendanceRate}%</div>
              <h3 className="text-lg font-bold text-white mb-1">출석률</h3>
              <div className="w-full bg-gray-800 rounded-full h-3 mt-2">
                <div 
                  className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 레벨 및 팀 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">선수 레벨</h3>
                  <p className="text-purple-400 text-sm">Player Level</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-purple-400 mb-2">{levelLabels[user.level]}</div>
                <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-3 rounded-full w-3/4 transition-all duration-500"></div>
                </div>
                <p className="text-sm text-gray-400">실력 등급 시스템</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border-indigo-500/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">팀 편성</h3>
                  <p className="text-indigo-400 text-sm">Team Formations</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-indigo-400 mb-2">{user.teamMembers.length}</div>
                <p className="text-sm text-gray-400">참여한 팀 구성</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 최근 참석 기록 - 데이터가 있을 때만 표시 */}
      {user.attendances.length > 0 && (
        <Card className="bg-gradient-to-br from-gray-900/90 to-black/90 border-gray-500/30 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl font-black text-white">최근 참석 기록</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.attendances.slice(0, 5).map((attendance, index) => (
                <div key={attendance.id} className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold text-sm">
                      {attendance.schedule.title}
                    </div>
                    <div className="text-gray-400 text-xs flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {attendance.schedule.location} • {new Date(attendance.schedule.date).toLocaleDateString('ko-KR', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </div>
                  </div>
                  <Badge className={`${statusColors[attendance.status]} text-xs px-3 py-1 rounded-full font-semibold`}>
                    {statusLabels[attendance.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


