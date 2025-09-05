import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut, Zap, User, Users, Menu, Calendar } from "lucide-react"
import { DashboardClient } from "@/app/dashboard-client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">
            PPUNG<span className="text-red-500">BROS</span>
          </h1>
          <p className="text-gray-300 mb-8">축구팀 밸런스 관리 시스템</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-300"
          >
            로그인하여 시작하기
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* 깔끔한 헤더 - 브랜딩과 기본 정보만 */}
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
                  선수: {session.user.name?.toUpperCase()} | 레벨: {session.user.level}
                </p>
              </div>
            </div>
            
                                    {/* 컨텍스트 메뉴 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-300"
                            >
                              <Menu className="w-4 h-4" />
                              <span className="hidden sm:inline ml-2">메뉴</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                              {session.user.name || '사용자'} ({session.user.level})
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem asChild>
                              <Link href={`/profile/${session.user.id}`} className="flex items-center">
                                <User className="w-4 h-4 mr-2" />
                                내 프로필
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                              <Link href="/members" className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                팀원 목록
                              </Link>
                            </DropdownMenuItem>
                            
                            {session.user.role === 'ADMIN' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>관리자 메뉴</DropdownMenuLabel>
                                
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/schedules/create" className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    일정 등록
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <form
                                action={async () => {
                                  "use server"
                                  await signOut({ redirectTo: "/auth/signin" })
                                }}
                                className="w-full"
                              >
                                <button 
                                  type="submit"
                                  className="flex items-center w-full text-red-400 hover:text-red-300"
                                >
                                  <LogOut className="w-4 h-4 mr-2" />
                                  로그아웃
                                </button>
                              </form>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20">
        <DashboardClient user={session.user} />
      </main>


      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}