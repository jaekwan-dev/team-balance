"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  description: z.string().optional(),
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

// 30분 단위 경기 시간 옵션들 (오전 6:00 ~ 오후 12:00)
const timeOptions = [
  { value: "06:00", label: "오전 6:00" },
  { value: "06:30", label: "오전 6:30" },
  { value: "07:00", label: "오전 7:00" },
  { value: "07:30", label: "오전 7:30" },
  { value: "08:00", label: "오전 8:00" },
  { value: "08:30", label: "오전 8:30" },
  { value: "09:00", label: "오전 9:00" },
  { value: "09:30", label: "오전 9:30" },
  { value: "10:00", label: "오전 10:00" },
  { value: "10:30", label: "오전 10:30" },
  { value: "11:00", label: "오전 11:00" },
  { value: "11:30", label: "오전 11:30" },
  { value: "12:00", label: "오후 12:00" },
  { value: "12:30", label: "오후 12:30" },
  { value: "13:00", label: "오후 1:00" },
  { value: "13:30", label: "오후 1:30" },
  { value: "14:00", label: "오후 2:00" },
  { value: "14:30", label: "오후 2:30" },
  { value: "15:00", label: "오후 3:00" },
  { value: "15:30", label: "오후 3:30" },
  { value: "16:00", label: "오후 4:00" },
  { value: "16:30", label: "오후 4:30" },
  { value: "17:00", label: "오후 5:00" },
  { value: "17:30", label: "오후 5:30" },
  { value: "18:00", label: "오후 6:00" },
  { value: "18:30", label: "오후 6:30" },
  { value: "19:00", label: "오후 7:00" },
  { value: "19:30", label: "오후 7:30" },
  { value: "20:00", label: "오후 8:00" },
  { value: "20:30", label: "오후 8:30" },
  { value: "21:00", label: "오후 9:00" },
  { value: "21:30", label: "오후 9:30" },
  { value: "22:00", label: "오후 10:00" },
  { value: "22:30", label: "오후 10:30" },
  { value: "23:00", label: "오후 11:00" },
  { value: "23:30", label: "오후 11:30" },
  { value: "00:00", label: "오후 12:00" },
]

interface Schedule {
  id: string
  title: string
  date: Date
  location: string
  description: string | null
  maxParticipants: number | null
}

export default function ScheduleEditForm({ schedule }: { schedule: Schedule }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const scheduleDate = new Date(schedule.date)
  const timeString = `${String(scheduleDate.getHours()).padStart(2, '0')}:${String(scheduleDate.getMinutes()).padStart(2, '0')}`

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      date: scheduleDate,
      time: timeString,
      location: schedule.location,
      maxParticipants: schedule.maxParticipants || 15,
      description: schedule.description || '',
    },
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
        description: data.description?.trim() || null,
      }

      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      })

      if (response.ok) {
        alert("일정이 성공적으로 수정되었습니다!")
        router.push("/")
      } else {
        const error = await response.json()
        alert(error.error || "일정 수정에 실패했습니다")
      }
    } catch (error) {
      console.error("Schedule edit error:", error)
      alert("일정 수정 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black/90 border-red-600/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center border-b border-red-600/30 pb-6">
        <CardTitle className="text-2xl font-black text-white tracking-tight">
          경기 일정 수정
        </CardTitle>
        <CardDescription className="text-gray-400 font-medium">
          기존 경기 일정을 수정해주세요
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
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString() || "15"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900/50 border-red-600/30 text-white focus:border-red-500 font-mono">
                          <SelectValue placeholder="최대 인원을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-red-600/50 max-h-60">
                        {[...Array(21)].map((_, i) => {
                          const num = i + 10
                          return (
                            <SelectItem 
                              key={num} 
                              value={num.toString()}
                              className="text-white hover:bg-red-600/20 font-mono focus:bg-red-600/20"
                            >
                              {num}명
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            {/* 공지사항 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-200 font-bold tracking-wider flex items-center">
                    📢 공지사항
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-red-600/30 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all resize-none font-mono"
                      placeholder="팀원들에게 전달할 중요한 공지사항을 입력하세요 (선택사항)"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* 수정/취소 버튼 */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white font-bold py-4 text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                    수정 중...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="w-5 h-5 mr-3" />
                    일정 수정하기
                  </div>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/')}
                className="bg-gray-600/50 hover:bg-gray-600 text-white font-bold py-4 px-6 text-lg rounded-lg transition-all duration-300"
              >
                취소
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}