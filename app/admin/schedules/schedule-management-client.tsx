"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Edit3, Trash2, Clock } from "lucide-react"

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
  createdBy: {
    name: string | null
  }
}

export function ScheduleManagementClient() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllSchedules()
  }, [])

  const fetchAllSchedules = async () => {
    try {
      const response = await fetch('/api/admin/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules)
      } else {
        console.error('일정 목록 조회 실패:', response.status)
      }
    } catch (error) {
      console.error('일정 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string, title: string) => {
    if (!confirm(`"${title}" 일정을 삭제하시겠습니까?\n삭제된 일정은 복구할 수 없습니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('일정이 삭제되었습니다.')
        await fetchAllSchedules() // 목록 새로고침
      } else {
        const error = await response.json()
        alert(error.error || '일정 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('일정 삭제 실패:', error)
      alert('일정 삭제 중 오류가 발생했습니다.')
    }
  }

  const getScheduleStatus = (dateStr: string) => {
    const scheduleDate = new Date(dateStr)
    const now = new Date()
    const diffTime = scheduleDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { status: '완료', color: 'bg-gray-600/20 text-gray-400 border-gray-600/50', days: Math.abs(diffDays) }
    } else if (diffDays === 0) {
      return { status: '오늘', color: 'bg-red-600/20 text-red-400 border-red-600/50', days: 0 }
    } else {
      return { status: `${diffDays}일 후`, color: 'bg-blue-600/20 text-blue-400 border-blue-600/50', days: diffDays }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">일정 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 일정을 날짜 순으로 정렬 (가장 최근 일정이 위로)
  const sortedSchedules = [...schedules].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      {/* 헤더 통계 */}
      {/* 일정 목록 */}
      {sortedSchedules.length > 0 ? (
        <div className="space-y-4">
          {sortedSchedules.map((schedule) => {
            const scheduleDate = new Date(schedule.date)
            const statusInfo = getScheduleStatus(schedule.date)
            
            return (
              <Card key={schedule.id} className="bg-gradient-to-br from-gray-900/90 to-black/90 border-gray-500/30 backdrop-blur-sm shadow-xl hover:border-gray-400/50 transition-all duration-300">
                <CardContent className="p-3 pt-0 pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold text-white">{schedule.title}</h3>
                            <Badge className={`${statusInfo.color} text-sm px-2 py-1 rounded-full font-semibold border`}>
                              {statusInfo.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => router.push(`/admin/schedules/edit/${schedule.id}`)}
                            size="sm"
                            className="bg-blue-600/80 hover:bg-blue-700 text-white"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">수정</span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteSchedule(schedule.id, schedule.title)}
                            size="sm"
                            className="bg-red-600/80 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">삭제</span>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <span>
                            {scheduleDate.toLocaleDateString('ko-KR', { 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span>
                            {scheduleDate.toLocaleTimeString('ko-KR', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4 text-green-400" />
                          <span className="truncate">{schedule.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-300">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span>{schedule._count.attendances}/{schedule.maxParticipants || 15}명</span>
                        </div>
                      </div>

                      {schedule.description && (
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3 mb-3">
                          <p className="text-orange-200 text-sm flex items-start">
                            <span className="text-orange-400 mr-2 flex-shrink-0">📢</span>
                            <span className="leading-relaxed">{schedule.description}</span>
                          </p>
                        </div>
                      )}

                      <div className="text-xs text-gray-400">
                        등록자: {schedule.createdBy.name || '알 수 없음'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Calendar className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">등록된 일정이 없습니다</h3>
          <p className="text-gray-400 text-lg mb-6">
            첫 번째 경기 일정을 등록해보세요!
          </p>
        </div>
      )}
    </div>
  )
}
