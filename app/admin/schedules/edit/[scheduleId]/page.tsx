import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import ScheduleEditForm from './schedule-edit-form'
import { CommonHeader } from '@/components/common-header'
import { Calendar } from 'lucide-react'

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
      <CommonHeader 
        icon={<Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
        iconBgColor="from-orange-600 to-orange-800"
        title={<>SCHEDULE<span className="text-orange-500">EDIT</span></>}
        subtitle="Edit Existing Match Schedule"
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ScheduleEditForm schedule={schedule} />
      </main>

      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}
