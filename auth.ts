import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import authConfig from "./auth.config"
import { prisma } from "@/lib/prisma"

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
  pages: {
    newUser: "/auth/profile-setup",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "kakao") {
        if (profile) {
          const kakaoProfile = profile as any
          user.kakaoId = account.providerAccountId
          user.name = kakaoProfile.nickname || user.name
          user.email = kakaoProfile.email || user.email
          user.image = kakaoProfile.profile_image_url || user.image
        }
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            role: true,
            level: true,
            isProfileComplete: true,
          },
        })
        
        if (dbUser) {
          session.user.role = dbUser.role
          session.user.level = dbUser.level
          session.user.isProfileComplete = dbUser.isProfileComplete
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  events: {
    async createUser({ user }) {
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
})