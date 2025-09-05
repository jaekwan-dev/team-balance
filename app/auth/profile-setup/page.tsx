"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, User, Phone, Target } from "lucide-react"

const profileSchema = z.object({
  name: z.string().min(2, "이름은 2글자 이상이어야 합니다"),
  phone: z.string().min(10, "올바른 전화번호를 입력해주세요").optional(),
  position: z.string().min(1, "선호 포지션을 선택해주세요"),
})

type ProfileFormData = z.infer<typeof profileSchema>

const positions = [
  { value: "GK", label: "골키퍼 (GK)" },
  { value: "CB", label: "센터백 (CB)" },
  { value: "LB", label: "레프트백 (LB)" },
  { value: "RB", label: "라이트백 (RB)" },
  { value: "CDM", label: "수비형 미드필더 (CDM)" },
  { value: "CM", label: "센터 미드필더 (CM)" },
  { value: "CAM", label: "공격형 미드필더 (CAM)" },
  { value: "LW", label: "레프트윙 (LW)" },
  { value: "RW", label: "라이트윙 (RW)" },
  { value: "ST", label: "스트라이커 (ST)" },
  { value: "ANY", label: "어디든 상관없음" },
]

export default function ProfileSetupPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name || "",
      phone: "",
      position: "",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // 세션 업데이트
        await update()
        router.push("/")
      } else {
        throw new Error("프로필 업데이트에 실패했습니다")
      }
    } catch (error) {
      console.error("Profile setup error:", error)
      alert("프로필 설정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-red-900">
      {/* Racing Stripes */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 z-50"></div>
      
      <div className="w-full max-w-md mx-4">
        {/* Team Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full mb-4 shadow-2xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <div className="px-4 py-2 bg-red-600/20 border border-red-600/50 rounded-lg inline-block">
            <span className="text-red-400 text-sm font-mono">선수 등록</span>
          </div>
        </div>

        <Card className="bg-black/90 border-red-600/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center border-b border-red-600/30 pb-6">
            <CardTitle className="text-2xl font-black text-white tracking-tight">
              선수 프로필 설정
            </CardTitle>
            <CardDescription className="text-gray-400 font-medium">
              축구 선수 정보를 설정해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                        <User className="w-4 h-4 mr-2 text-red-500" />
                        선수명 *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="이름을 입력하세요" 
                          className="bg-gray-900/50 border-red-600/30 text-white placeholder-gray-500 focus:border-red-500 font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-yellow-500" />
                        연락처
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="010-1234-5678" 
                          className="bg-gray-900/50 border-red-600/30 text-white placeholder-gray-500 focus:border-red-500 font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                        <Target className="w-4 h-4 mr-2 text-green-500" />
                        선호 포지션 *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-900/50 border-red-600/30 text-white focus:border-red-500 font-mono">
                            <SelectValue placeholder="포지션 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-900 border-red-600/50">
                          {positions.map((position) => (
                            <SelectItem 
                              key={position.value} 
                              value={position.value}
                              className="text-white hover:bg-red-600/20 font-mono"
                            >
                              {position.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      설정 중...
                    </div>
                  ) : (
                    "등록 완료"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Racing Grid Pattern */}
        <div className="mt-8 flex justify-center space-x-1">
          {Array.from({ length: 11 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-1 h-8 ${i % 2 === 0 ? 'bg-white' : 'bg-red-600'} ${i === 5 ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-black via-red-600 to-black"></div>
    </div>
  )
}
