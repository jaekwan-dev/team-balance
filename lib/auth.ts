import NextAuth from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"

interface KakaoProfile {
  sub?: string // OpenID Connect subject identifier
  nickname?: string
  email?: string
  email_verified?: boolean
  profile_image_url?: string
  name?: string // 실제 이름 (OpenID Connect에서 제공)
  given_name?: string
  family_name?: string
  preferred_username?: string
}

export const config = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // JWT 세션 전략 사용 (Database 세션이 작동하지 않음)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ["pkce", "state"],
      authorization: {
        params: {
          scope: "openid profile email", // OpenID Connect 스코프
          response_type: "code",
        },
      },
      // OpenID Connect를 사용하도록 설정
      wellKnown: "https://kauth.kakao.com/.well-known/openid-configuration",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.nickname || profile.name,
          email: profile.email,
          image: profile.picture || profile.profile_image_url,
          role: "MEMBER" as const,
          level: "ROOKIE" as const,
          isProfileComplete: false,
        }
      },
    }),
  ],
  trustHost: true,
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    callbackUrl: {
      name: "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    pkceCodeVerifier: {
      name: "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    state: {
      name: "authjs.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
  debug: true, // 디버그 로그 활성화하여 문제 확인
  experimental: {
    enableWebAuthn: false,
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/profile-setup",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "kakao" && profile) {
          const kakaoProfile = profile as KakaoProfile
          // 필수 정보만 빠르게 설정
          user.kakaoId = kakaoProfile.sub || account.providerAccountId
          user.name = kakaoProfile.nickname || user.name
          user.email = kakaoProfile.email || user.email
          user.image = kakaoProfile.profile_image_url || user.image
        }
        console.log('[AUTH] Sign in successful:', { userId: user.id, provider: account?.provider })
        return true
      } catch (error) {
        console.error('[AUTH] Sign in error:', error)
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      // 상대 URL인 경우 baseUrl과 결합
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // 같은 도메인인 경우 그대로 반환
      else if (new URL(url).origin === baseUrl) return url
      // 외부 URL인 경우 baseUrl로 리다이렉트
      return baseUrl
    },
    async session({ session, token }) {
      // JWT 세션 전략에서는 token 객체가 제공됨
      if (session.user && token) {
        session.user.id = token.sub as string
        session.user.role = (token.role as "ADMIN" | "MEMBER") || "MEMBER"
        session.user.level = (token.level as "PRO" | "SEMI_PRO_1" | "SEMI_PRO_2" | "SEMI_PRO_3" | "AMATEUR_1" | "AMATEUR_2" | "AMATEUR_3" | "AMATEUR_4" | "AMATEUR_5" | "BEGINNER_1" | "BEGINNER_2" | "BEGINNER_3" | "ROOKIE") || "ROOKIE"
        session.user.isProfileComplete = (token.isProfileComplete as boolean) || false
        session.user.kakaoId = token.kakaoId as string
      }
      return session
    },
    async jwt({ token, user, account, profile, trigger }) {
      // 초기 로그인 시
      if (account && profile) {
        const kakaoProfile = profile as KakaoProfile
        token.sub = kakaoProfile.sub || account.providerAccountId
        token.kakaoId = kakaoProfile.sub || account.providerAccountId
        token.email_verified = kakaoProfile.email_verified
      }
      
      // user 정보를 token에 저장 (초기 로그인 시)
      if (user) {
        token.role = user.role
        token.level = user.level
        token.isProfileComplete = user.isProfileComplete
        token.kakaoId = user.kakaoId
      }
      
      // 매 요청마다 DB에서 최신 role/level 확인 (세션 갱신)
      if (token.sub && !user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true, level: true, isProfileComplete: true },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.level = dbUser.level
            token.isProfileComplete = dbUser.isProfileComplete
          }
        } catch (error) {
          console.error('[AUTH] JWT refresh error:', error)
        }
      }
      
      return token
    },
  },
  events: {
    async createUser({ user }) {
      try {
        console.log('[AUTH] Creating new user:', { userId: user.id, email: user.email })
        // 새 사용자 생성 시 기본값만 빠르게 설정
        await prisma.user.update({
          where: { id: user.id },
          data: {
            kakaoId: user.kakaoId,
            level: "ROOKIE",
            role: "MEMBER",
            isProfileComplete: false,
            emailVerified: user.emailVerified || null,
          },
          select: { id: true }
        })
        console.log('[AUTH] User created successfully:', user.id)
      } catch (error) {
        console.error('[AUTH] Error creating user:', error)
      }
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
