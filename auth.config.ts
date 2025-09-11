import type { NextAuthConfig } from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"

export default {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
} satisfies NextAuthConfig