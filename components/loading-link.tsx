"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import NProgress from "nprogress"
import type { ReactNode } from "react"

interface LoadingLinkProps {
  href: string
  children: ReactNode
  className?: string
  prefetch?: boolean
}

export function LoadingLink({ href, children, className, prefetch = true }: LoadingLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    NProgress.start()
    router.push(href)
  }

  return (
    <Link 
      href={href} 
      className={className}
      prefetch={prefetch}
      onClick={handleClick}
    >
      {children}
    </Link>
  )
}

