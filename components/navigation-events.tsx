"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import NProgress from "nprogress"

// NProgress 설정
NProgress.configure({ 
  showSpinner: false,
  speed: 200,
  minimum: 0.1,
  trickleSpeed: 200
})

export function NavigationEvents() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 페이지 전환 완료
    NProgress.done()
  }, [pathname, searchParams])

  return null
}

