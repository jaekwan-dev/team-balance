import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ProfileSetupClient from "./profile-setup-client"

export default async function ProfileSetupPage() {
  const session = await auth()

  // 로그인하지 않은 사용자는 홈으로
  if (!session?.user) {
    redirect("/")
  }

  // 이미 프로필이 완료된 사용자는 홈으로
  if (session.user.isProfileComplete) {
    redirect("/")
  }

  return <ProfileSetupClient />
}