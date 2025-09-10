import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ScheduleEditForm from './schedule-edit-form'
import { Zap } from 'lucide-react'

export default async function ScheduleEditPage({ 
  params 
}: { 
  params: Promise<{ scheduleId: string }> 
}) {
  const session = await auth()
  const { scheduleId } = await params

  if (!session?.user || session.user.role !== 'ADMIN') {
    notFound()
  }

  // 기존 일정 데이터 조회
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    select: {
      id: true,
      title: true,
      date: true,
      location: true,
      description: true,
      maxParticipants: true
    }
  })

  if (!schedule) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* 헤더 - SCHEDULEMODIFY */}
      <header className="bg-black/90 backdrop-blur-sm border-b-2 border-red-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            {/* 로고 및 앱 이름 */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  PPUNG<span className="text-red-500">BROS</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 font-medium">
                  SCHEDULEMODIFY | 관리자: {session.user.name?.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        <ScheduleEditForm schedule={schedule} />
      </main>
    </div>
  )
}
