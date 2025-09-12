import { Suspense } from "react"
import { LoginClient } from "./login-client"

export default function LoginLoading() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">
            PPUNG<span className="text-red-500">BROS</span>
          </h1>
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500/50 to-yellow-400/50 text-black/50 font-bold rounded-lg">
            카카오로 로그인하기
          </div>
        </div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}