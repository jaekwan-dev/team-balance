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
          prompt: "select_account", // 항상 계정 선택 화면 표시
          scope: "openid profile email", // OpenID Connect 스코프
          response_type: "code",
        },
      },
      // OpenID Connect를 사용하도록 설정
      wellKnown: "https://kauth.kakao.com/.well-known/openid-configuration",
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.nickname || profile.name,
          email: profile.email,
          image: profile.picture || profile.profile_image_url,
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
  debug: process.env.NODE_ENV === "development",
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
        // OpenID Connect로부터 받은 프로필 정보 처리
        if (profile) {
          const kakaoProfile = profile as KakaoProfile
          
          // OpenID Connect의 sub를 kakaoId로 사용
          user.kakaoId = kakaoProfile.sub || account.providerAccountId
          
          // 닉네임 저장 (표시용)
          user.name = kakaoProfile.nickname || kakaoProfile.preferred_username || user.name
          
          // 이메일 저장
          user.email = kakaoProfile.email || user.email
          
          // 프로필 이미지
          user.image = kakaoProfile.profile_image_url || user.image
          
          console.log("Kakao OIDC Profile:", {
            sub: kakaoProfile.sub,
            nickname: kakaoProfile.nickname,
            email: kakaoProfile.email,
            name: kakaoProfile.name,
            email_verified: kakaoProfile.email_verified
          })
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
        // 사용자가 DB에 존재하는지 확인 (탈퇴한 사용자 체크)
        const existingUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        
        // 사용자가 존재하지 않으면 세션을 null로 반환 (로그아웃 처리)
        if (!existingUser) {
          return null
        }
        
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
      // 새 사용자 생성 시 기본값 설정
      console.log("Creating new user with OIDC:", user)
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          kakaoId: user.kakaoId,
          level: "ROOKIE",
          role: "MEMBER",
          isProfileComplete: false,
          // OpenID Connect에서 받은 이메일 인증 상태 저장
          emailVerified: user.emailVerified || null,
        },
      })
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
