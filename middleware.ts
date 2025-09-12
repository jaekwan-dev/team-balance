import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request
  
  // API 경로는 별도 처리
  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // 정적 파일들은 통과
  if (nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  // auth 관련 경로는 통과
  if (nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // 세션 체크
  const session = await auth()
  
  // 세션이 null이면 (탈퇴한 사용자 포함) 로그인 페이지로 리다이렉트
  if (!session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
