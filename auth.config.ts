import type { NextAuthConfig } from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"

export default {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      checks: ["none"],  // 모든 체크 비활성화 (개발 환경)
    }),
  ],
} satisfies NextAuthConfig