import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CommonHeader } from "@/components/common-header"
import { ProfileClient } from "./profile-client"
import { User } from "lucide-react"

export default async function ProfilePage({ 
  params 
}: { 
  params: Promise<{ userId: string }> 
}) {
  const { userId } = await params
  const session = await auth()

  // 로그인 확인
  if (!session?.user) {
    redirect('/')
  }

  // 권한 확인 (관리자이거나 본인의 프로필인 경우만)
  if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      <CommonHeader 
        icon={<User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
        iconBgColor="from-red-600 to-red-800"
        title={<>PLAYER<span className="text-red-500">PROFILE</span></>}
        subtitle="Statistics & Performance"
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileClient userId={userId} />
      </main>

      {/* F1 Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}


