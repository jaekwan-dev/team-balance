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
  debug: false, // 디버그 로그 비활성화로 성능 향상
  experimental: {
    enableWebAuthn: false,
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/profile-setup",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "kakao" && profile) {
        const kakaoProfile = profile as KakaoProfile
        // 필수 정보만 빠르게 설정
        user.kakaoId = kakaoProfile.sub || account.providerAccountId
        user.name = kakaoProfile.nickname || user.name
        user.email = kakaoProfile.email || user.email
        user.image = kakaoProfile.profile_image_url || user.image
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      // 상대 URL인 경우 baseUrl과 결합
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // 같은 도메인인 경우 그대로 반환
      else if (new URL(url).origin === baseUrl) return url
      // 외부 URL인 경우 baseUrl로 리다이렉트
      return baseUrl
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
        session.user.level = user.level
        session.user.isProfileComplete = user.isProfileComplete
        session.user.kakaoId = user.kakaoId
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      // 초기 로그인 시
      if (account && profile) {
        const kakaoProfile = profile as KakaoProfile
        token.sub = kakaoProfile.sub || account.providerAccountId
        token.kakaoId = kakaoProfile.sub || account.providerAccountId
        token.email_verified = kakaoProfile.email_verified
      }
      
      if (user) {
        token.role = user.role
        token.level = user.level
        token.isProfileComplete = user.isProfileComplete
        token.kakaoId = user.kakaoId
      }
      return token
    },
  },
  events: {
    async createUser({ user }) {
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
        select: { id: true } // 필요한 필드만 반환
      })
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
