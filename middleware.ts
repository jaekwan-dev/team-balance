import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { nextUrl } = request
  
  // API 경로는 별도 처리
  if (nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // 정적 파일들은 통과
  if (nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  // 모든 경로 접근 허용 (인증 체크는 페이지 레벨에서 처리)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
