"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { AuthLoading } from "@/components/auth-loading"

export function LoginClient() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    await signIn("kakao", { redirectTo: "/" })
  }

  if (isLoading) {
    return <AuthLoading />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">
          PPUNG<span className="text-red-500">BROS</span>
        </h1>
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          카카오로 로그인하기
        </Button>
      </div>
    </div>
  )
}