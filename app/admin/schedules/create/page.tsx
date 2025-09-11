import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CommonHeader } from "@/components/common-header"
import { ScheduleCreateForm } from "./schedule-create-form"
import { Calendar } from "lucide-react"

export default async function CreateSchedulePage() {
  const session = await auth()

  // 관리자 권한 확인
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      <CommonHeader 
        icon={<Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
        iconBgColor="from-green-600 to-green-800"
        title={<>SCHEDULE<span className="text-green-500">CREATE</span></>}
        subtitle="Create New Match Schedule"
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ScheduleCreateForm />
      </main>

      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}
