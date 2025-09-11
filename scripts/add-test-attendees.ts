import { prisma } from "../lib/prisma"
import { AttendanceStatus, Level } from "@prisma/client"

async function addTestAttendees() {
  try {
    // 가장 최근 일정 가져오기
    const nextSchedule = await prisma.schedule.findFirst({
      where: {
        date: {
          gte: new Date()
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    if (!nextSchedule) {
      console.log("다음 일정이 없습니다.")
      return
    }

    console.log(`다음 일정: ${nextSchedule.title} (${nextSchedule.date})`)

    // 테스트 게스트 참석자 데이터
    const testGuests = [
      { name: "김테스트", level: Level.PRO },
      { name: "이테스트", level: Level.PRO },
      { name: "박테스트", level: Level.SEMI_PRO_3 },
      { name: "최테스트", level: Level.SEMI_PRO_2 },
      { name: "정테스트", level: Level.SEMI_PRO_1 },
      { name: "강테스트", level: Level.AMATEUR_3 },
      { name: "조테스트", level: Level.AMATEUR_2 },
      { name: "윤테스트", level: Level.AMATEUR_1 },
      { name: "장테스트", level: Level.BEGINNER_3 },
      { name: "임테스트", level: Level.BEGINNER_2 },
    ]

    // 참석자 추가
    for (const guest of testGuests) {
      await prisma.attendance.create({
        data: {
          scheduleId: nextSchedule.id,
          guestName: guest.name,
          guestLevel: guest.level,
          status: AttendanceStatus.ATTEND
        }
      })
      console.log(`추가됨: ${guest.name} (${guest.level})`)
    }

    // 결과 확인
    const totalAttendees = await prisma.attendance.count({
      where: {
        scheduleId: nextSchedule.id,
        status: AttendanceStatus.ATTEND
      }
    })

    console.log(`\n총 ${totalAttendees}명의 참석자가 등록되었습니다.`)
    console.log("대시보드에서 자동팀편성 기능을 테스트할 수 있습니다!")

  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestAttendees()