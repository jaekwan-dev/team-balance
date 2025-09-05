"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Trophy, Calendar, Mail, Phone, Shield } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface Member {
  id: string
  name: string | null
  image: string | null
  email: string | null
  phone: string | null
  level: string
  role: string
  position: string | null
  isProfileComplete: boolean
  createdAt: string
}

export function MembersClient({ currentUserRole }: { currentUserRole: string }) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.users)
      } else {
        console.error('멤버 목록 조회 실패:', response.status)
      }
    } catch (error) {
      console.error('멤버 목록을 불러오는데 실패했습니다:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserLevel = async (userId: string, newLevel: string) => {
    try {
      const response = await fetch('/api/members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, level: newLevel }),
      })

      if (response.ok) {
        await fetchMembers() // 목록 새로고침
        alert('레벨이 성공적으로 변경되었습니다!')
      } else {
        alert('레벨 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('레벨 업데이트 실패:', error)
      alert('레벨 변경에 실패했습니다.')
    }
  }

  const updateUserRole = async (userId: string, newRole: 'MEMBER' | 'ADMIN') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        await fetchMembers() // 목록 새로고침
        alert('역할이 성공적으로 변경되었습니다!')
      } else {
        alert('역할 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('역할 업데이트 실패:', error)
      alert('역할 변경에 실패했습니다.')
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'PRO': return 'bg-purple-600/20 text-purple-400 border-purple-600/50'
      case 'SEMI_PRO_1': 
      case 'SEMI_PRO_2': 
      case 'SEMI_PRO_3': return 'bg-blue-600/20 text-blue-400 border-blue-600/50'
      case 'AMATEUR_1': 
      case 'AMATEUR_2': 
      case 'AMATEUR_3': return 'bg-green-600/20 text-green-400 border-green-600/50'
      case 'AMATEUR_4': 
      case 'AMATEUR_5': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50'
      case 'BEGINNER_1': 
      case 'BEGINNER_2': 
      case 'BEGINNER_3': return 'bg-orange-600/20 text-orange-400 border-orange-600/50'
      case 'ROOKIE': return 'bg-gray-600/20 text-gray-400 border-gray-600/50'
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/50'
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case 'PRO': return '프로'
      case 'SEMI_PRO_1': return '세미프로 1'
      case 'SEMI_PRO_2': return '세미프로 2'
      case 'SEMI_PRO_3': return '세미프로 3'
      case 'AMATEUR_1': return '아마추어 1'
      case 'AMATEUR_2': return '아마추어 2'
      case 'AMATEUR_3': return '아마추어 3'
      case 'AMATEUR_4': return '아마추어 4'
      case 'AMATEUR_5': return '아마추어 5'
      case 'BEGINNER_1': return '비기너 1'
      case 'BEGINNER_2': return '비기너 2'
      case 'BEGINNER_3': return '비기너 3'
      case 'ROOKIE': return '루키'
      default: return level
    }
  }

  const levelOptions = [
    { value: 'PRO', label: '프로' },
    { value: 'SEMI_PRO_1', label: '세미프로 1' },
    { value: 'SEMI_PRO_2', label: '세미프로 2' },
    { value: 'SEMI_PRO_3', label: '세미프로 3' },
    { value: 'AMATEUR_1', label: '아마추어 1' },
    { value: 'AMATEUR_2', label: '아마추어 2' },
    { value: 'AMATEUR_3', label: '아마추어 3' },
    { value: 'AMATEUR_4', label: '아마추어 4' },
    { value: 'AMATEUR_5', label: '아마추어 5' },
    { value: 'BEGINNER_1', label: '비기너 1' },
    { value: 'BEGINNER_2', label: '비기너 2' },
    { value: 'BEGINNER_3', label: '비기너 3' },
    { value: 'ROOKIE', label: '루키' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">멤버 목록을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 통계 */}
      <Card className="bg-gradient-to-br from-blue-900/90 to-blue-800/90 border-blue-500/30 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black text-white">전체 팀원</CardTitle>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-blue-400">{members.length}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 멤버 목록 */}
      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, index) => (
            <Card key={member.id} className="bg-gradient-to-br from-gray-900/90 to-black/90 border-gray-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-500 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {/* 카카오 프로필 사진 또는 기본 아바타 */}
                    <div className="relative">
                      {member.image ? (
                        <Image 
                          src={member.image} 
                          alt={member.name || '프로필'} 
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-600/50"
                        />
                      ) : (
                        <div className={`w-12 h-12 ${member.role === 'ADMIN' ? 'bg-gradient-to-r from-yellow-600 to-yellow-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} rounded-full flex items-center justify-center`}>
                          <span className="text-white font-bold text-lg">
                            {member.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {member.name || '이름 없음'}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {member.role === 'ADMIN' && (
                          <Badge className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 text-yellow-400 border-yellow-600/50 text-xs px-2 py-1 rounded-full">
                            👑 관리자
                          </Badge>
                        )}
                        <Badge className={`${getLevelBadgeColor(member.level)} text-xs px-2 py-1 rounded-full border`}>
                          {getLevelText(member.level)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="space-y-3">
                  {/* 연락처 정보는 관리자만 표시 */}
                  {currentUserRole === 'ADMIN' && member.email && (
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-400">이메일</div>
                          <div className="text-white font-semibold text-sm">{member.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentUserRole === 'ADMIN' && member.phone && (
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-400">연락처</div>
                          <div className="text-white font-semibold text-sm">{member.phone}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {member.position && (
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-400">포지션</div>
                          <div className="text-white font-semibold text-sm">{member.position}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-400">가입일</div>
                        <div className="text-white font-semibold text-sm">
                          {new Date(member.createdAt).toLocaleDateString('ko-KR', { 
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 관리자 전용 기능 */}
                {currentUserRole === 'ADMIN' && (
                  <div className="space-y-3">
                    {/* 레벨 관리 */}
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="text-xs text-gray-400 mb-2">레벨 관리</div>
                      <Select onValueChange={(value) => updateUserLevel(member.id, value)} defaultValue={member.level}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600/50 text-white text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600/50">
                          {levelOptions.map((level) => (
                            <SelectItem 
                              key={level.value} 
                              value={level.value}
                              className="text-white hover:bg-gray-700 text-xs"
                            >
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 관리자 승격 (일반 멤버만) */}
                    {member.role === 'MEMBER' && (
                      <Button
                        onClick={() => updateUserRole(member.id, 'ADMIN')}
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-2 rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all duration-300"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        관리자로 승격
                      </Button>
                    )}
                  </div>
                )}

                {/* 프로필 완성도 */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">프로필 완성도</span>
                    <span className={`font-semibold ${member.isProfileComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                      {member.isProfileComplete ? '완료' : '미완료'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        member.isProfileComplete 
                          ? 'bg-gradient-to-r from-green-500 to-green-400' 
                          : 'bg-gradient-to-r from-yellow-500 to-yellow-400'
                      }`}
                      style={{ width: member.isProfileComplete ? '100%' : '60%' }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Users className="w-12 h-12 text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">등록된 멤버가 없습니다</h3>
          <p className="text-gray-400 text-lg">
            첫 번째 멤버가 되어보세요!
          </p>
        </div>
      )}
    </div>
  )
}
