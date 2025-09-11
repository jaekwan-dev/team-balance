import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CommonHeader } from "@/components/common-header"
import { MembersClient } from "./members-client"
import { Users } from "lucide-react"

export default async function MembersPage() {
  const session = await auth()

  // 로그인 확인
  if (!session?.user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      <CommonHeader 
        icon={<Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
        iconBgColor="from-blue-600 to-blue-800"
        title={<>TEAM<span className="text-blue-500">MEMBERS</span></>}
        subtitle="All Members Information"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MembersClient currentUserRole={session.user.role} />
      </main>

      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}
