"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, MapPin, Users, Clock, Save, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const scheduleSchema = z.object({
  date: z.date(),
  time: z.string().min(1, "시간을 선택해주세요"),
  location: z.string().min(2, "장소는 2글자 이상 입력해주세요"),
  maxParticipants: z.number().min(1, "최대 인원은 1명 이상이어야 합니다").optional(),
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

// 일반적인 경기 시간 옵션들
const timeOptions = [
  { value: "09:00", label: "오전 9:00" },
  { value: "10:00", label: "오전 10:00" },
  { value: "11:00", label: "오전 11:00" },
  { value: "12:00", label: "오후 12:00" },
  { value: "13:00", label: "오후 1:00" },
  { value: "14:00", label: "오후 2:00" },
  { value: "15:00", label: "오후 3:00" },
  { value: "16:00", label: "오후 4:00" },
  { value: "17:00", label: "오후 5:00" },
  { value: "18:00", label: "오후 6:00" },
  { value: "19:00", label: "오후 7:00" },
  { value: "20:00", label: "오후 8:00" },
  { value: "21:00", label: "오후 9:00" },
]

export function ScheduleCreateForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      time: "",
      location: "",
      maxParticipants: undefined, // 빈 값으로 시작
    } as Partial<ScheduleFormData>,
  })

  const onSubmit = async (data: ScheduleFormData) => {
    // 필수 필드 검증
    if (!data.date) {
      alert("날짜를 선택해주세요")
      return
    }
    if (!data.time) {
      alert("시간을 선택해주세요")
      return
    }
    if (!data.location || data.location.trim().length < 2) {
      alert("장소를 2글자 이상 입력해주세요")
      return
    }

    setIsLoading(true)
    try {
      // 날짜와 시간을 합쳐서 DateTime으로 변환
      const [hours, minutes] = data.time.split(':')
      const dateTime = new Date(data.date)
      dateTime.setHours(parseInt(hours), parseInt(minutes))
      
      const scheduleData = {
        title: `${format(data.date, 'M월 d일', { locale: ko })} 경기`,
        date: dateTime.toISOString(),
        location: data.location.trim(),
        maxParticipants: data.maxParticipants || 15, // 기본값 15명
        description: null,
      }

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      })

      if (response.ok) {
        alert("일정이 성공적으로 등록되었습니다!")
        router.push("/")
      } else {
        const error = await response.json()
        alert(error.error || "일정 등록에 실패했습니다")
      }
    } catch (error) {
      console.error("Schedule creation error:", error)
      alert("일정 등록 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black/90 border-red-600/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center border-b border-red-600/30 pb-6">
        <CardTitle className="text-2xl font-black text-white tracking-tight">
          새로운 경기 일정 등록
        </CardTitle>
        <CardDescription className="text-gray-400 font-medium">
          팀원들과 함께할 경기 일정을 등록해주세요
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 날짜와 시간 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-2 text-blue-500" />
                      날짜 *
                    </FormLabel>
                    <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "bg-gray-900/50 border-red-600/30 text-white hover:bg-gray-800/50 hover:text-white font-mono justify-start text-left",
                              !field.value && "text-gray-500"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "yyyy년 M월 d일", { locale: ko })
                            ) : (
                              <span>날짜를 선택해주세요</span>
                            )}
                            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-red-600/50" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setIsDatePickerOpen(false)
                          }}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="text-white"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-green-500" />
                      시간 *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-900/50 border-red-600/30 text-white focus:border-red-500 font-mono">
                          <SelectValue placeholder="시간을 선택해주세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-red-600/50 max-h-60">
                        {timeOptions.map((time) => (
                          <SelectItem 
                            key={time.value} 
                            value={time.value}
                            className="text-white hover:bg-red-600/20 font-mono focus:bg-red-600/20"
                          >
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* 장소와 최대인원 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-yellow-500" />
                      장소 *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="예: 서울월드컵경기장" 
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
                name="maxParticipants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                      <Users className="w-4 h-4 mr-2 text-purple-500" />
                      최대 인원
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="50"
                        placeholder="15" 
                        className="bg-gray-900/50 border-red-600/30 text-white placeholder-gray-500 focus:border-red-500 font-mono"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            field.onChange(undefined)
                          } else {
                            const numValue = parseInt(value)
                            if (!isNaN(numValue)) {
                              field.onChange(numValue)
                            }
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* 등록 버튼 */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  등록 중...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-3" />
                  일정 등록하기
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
