import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { nextUrl } = request
  
  // 공개 경로들
  const publicRoutes = ["/auth/signin", "/auth/profile-setup"]
  const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route))

  // API 경로는 별도 처리
  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // 정적 파일들은 통과
  if (nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  // 임시로 인증 체크를 비활성화 (NextAuth 세션 체크 문제로 인해)
  // 로그인하지 않은 사용자를 로그인 페이지로 리다이렉트
  if (!isPublicRoute && nextUrl.pathname !== "/") {
    // 일단 모든 사용자가 접근 가능하도록 설정
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
