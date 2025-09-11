"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Member {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  level: string
  role: string
  isProfileComplete: boolean
  createdAt: string
}

export function MembersClient({ currentUserRole }: { currentUserRole: string }) {
  const router = useRouter()
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

  // 레벨별로 멤버 그룹화
  const groupMembersByLevel = (members: Member[]) => {
    const levelOrder = ['PRO', 'SEMI_PRO_1', 'SEMI_PRO_2', 'SEMI_PRO_3', 'AMATEUR_1', 'AMATEUR_2', 'AMATEUR_3', 'AMATEUR_4', 'AMATEUR_5', 'BEGINNER_1', 'BEGINNER_2', 'BEGINNER_3', 'ROOKIE']
    const grouped: { [key: string]: Member[] } = {}
    
    // 레벨별 그룹 생성
    members.forEach(member => {
      if (!grouped[member.level]) {
        grouped[member.level] = []
      }
      grouped[member.level].push(member)
    })
    
    // 레벨 순서대로 정렬
    return levelOrder.filter(level => grouped[level]?.length > 0).map(level => ({
      level,
      members: grouped[level].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-lg">멤버 목록을 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 간소화된 헤더 */}
      <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg p-4 border border-blue-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600/80 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">전체 팀원</h2>
          </div>
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/50 text-lg px-3 py-1 font-bold">
            {members.length}명
          </Badge>
        </div>
      </div>

      {/* 멤버 목록 - 레벨별로 그룹화 */}
      {members.length > 0 ? (
        <div className="space-y-6">
          {groupMembersByLevel(members).map((group) => (
            <Card key={group.level} className="bg-gradient-to-br from-gray-900/90 to-black/90 border-gray-500/30 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white flex items-center">
                    <Badge className={`${getLevelBadgeColor(group.level)} text-sm px-3 py-1 rounded-full border font-bold mr-3`}>
                      {getLevelText(group.level)}
                    </Badge>
                    <span className="text-gray-400 text-base">({group.members.length}명)</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 pb-0">
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div 
                      key={member.id} 
                      onClick={() => router.push(`/profile/${member.id}`)}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all duration-300 border border-gray-700/30 cursor-pointer hover:border-gray-600/50"
                    >
                      {/* 이름과 관리자 표시 */}
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-white font-medium text-sm truncate">
                          {member.name || '이름 없음'}
                        </span>
                        {member.role === 'ADMIN' && (
                          <Badge className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 text-yellow-400 border-yellow-600/50 text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                            👑
                          </Badge>
                        )}
                      </div>
                      
                      {/* 레벨 - 관리자만 선택창 */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {currentUserRole === 'ADMIN' && (
                          <Select
                            value={member.level}
                            onValueChange={(value) => updateUserLevel(member.id, value)}
                          >
                            <SelectTrigger 
                              className="bg-gray-800/50 border-gray-600/50 text-white text-xs h-7 w-24"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600/50">
                              {levelOptions.map((level) => (
                                <SelectItem key={level.value} value={level.value} className="text-white hover:bg-gray-700 text-xs">
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
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
