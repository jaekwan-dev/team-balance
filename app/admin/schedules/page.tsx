import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CommonHeader } from "@/components/common-header"
import { ScheduleManagementClient } from "./schedule-management-client"

export default async function ScheduleManagementPage() {
  const session = await auth()

  // 관리자 권한 확인
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      <CommonHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <ScheduleManagementClient />
      </main>

      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}
