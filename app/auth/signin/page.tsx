import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageCircle } from "lucide-react"
import { FaFutbol } from "react-icons/fa"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      
      <div className="w-full max-w-md mx-4">
        {/* Team Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-600 to-red-800 rounded-full mb-4 shadow-2xl">
            <FaFutbol className="w-12 h-12 text-white" />
          </div>
        </div>

        <Card className="bg-black/90 border-red-600/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center border-b border-red-600/30 pb-6">
            <CardTitle className="text-3xl font-black text-white tracking-tight">
              PPUNG<span className="text-red-500">BROS</span>
            </CardTitle>
            <CardDescription className="text-gray-400 font-medium tracking-wide">
              뻥브로스
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-3">
            <form
              action={async () => {
                "use server"
                await signIn("kakao", { redirectTo: "/" })
              }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-bold py-6 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <MessageCircle className="w-6 h-7 mr-3" />
                카카오 로그인
              </Button>
            </form>
            
            <div className="text-center space-y-0">
              <div className="flex items-center justify-center space-x-2 text-gray-400">
                {/* <span className="text-xs font-mono tracking-wider">로그인시 자동 회원가입 됩니다.</span> */}
              </div>
              <div className="px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-lg">
                <span className="text-red-400 text-xs font-mono">로그인시 자동 회원가입 됩니다.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Racing Grid Pattern */}
        <div className="mt-8 flex justify-center space-x-1">
          {Array.from({ length: 15 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-1 h-12 ${i % 2 === 0 ? 'bg-white' : 'bg-red-600'} ${i === 7 ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}
