"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    Configuration: "인증 설정에 문제가 있습니다. 관리자에게 문의하세요.",
    AccessDenied: "접근이 거부되었습니다.",
    Verification: "인증 토큰이 만료되었거나 이미 사용되었습니다.",
    OAuthSignin: "OAuth 로그인 중 오류가 발생했습니다.",
    OAuthCallback: "OAuth 콜백 처리 중 오류가 발생했습니다.",
    OAuthCreateAccount: "OAuth 계정 생성 중 오류가 발생했습니다.",
    EmailCreateAccount: "이메일 계정 생성 중 오류가 발생했습니다.",
    Callback: "콜백 처리 중 오류가 발생했습니다.",
    OAuthAccountNotLinked: "이미 다른 방법으로 가입된 계정입니다.",
    EmailSignin: "이메일 로그인 중 오류가 발생했습니다.",
    CredentialsSignin: "로그인 정보가 올바르지 않습니다.",
    Default: "인증 중 오류가 발생했습니다.",
  }

  const message = errorMessages[error || "Default"] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">로그인 오류</h1>
          <p className="mt-2 text-gray-600">{message}</p>
          {error && (
            <p className="mt-1 text-sm text-gray-500">오류 코드: {error}</p>
          )}
        </div>
        <div className="flex justify-center">
          <Link
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            다시 로그인하기
          </Link>
        </div>
      </div>
    </div>
  )
}