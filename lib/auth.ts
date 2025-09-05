import NextAuth from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"

interface KakaoProfile {
  nickname?: string
  email?: string
  profile_image_url?: string
}

export const config = {
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  experimental: {
    enableWebAuthn: false,
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/profile-setup",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "kakao") {
        // 카카오 프로필 정보를 사용자 정보에 추가
        if (profile) {
          const kakaoProfile = profile as KakaoProfile
          user.kakaoId = account.providerAccountId
          user.name = kakaoProfile.nickname || user.name
          user.email = kakaoProfile.email || user.email
          user.image = kakaoProfile.profile_image_url || user.image
        }
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
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.level = user.level
        token.isProfileComplete = user.isProfileComplete
      }
      return token
    },
  },
  events: {
    async createUser({ user }) {
      // 새 사용자 생성 시 기본값 설정
      await prisma.user.update({
        where: { id: user.id },
        data: {
          kakaoId: user.kakaoId,
          level: "ROOKIE",
          role: "MEMBER",
          isProfileComplete: false,
        },
      })
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
