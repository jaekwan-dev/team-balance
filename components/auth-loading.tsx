"use client"

import { Loader2 } from "lucide-react"

export function AuthLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium">로딩 중...</p>
      </div>
    </div>
  )
}