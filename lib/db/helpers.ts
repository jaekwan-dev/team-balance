import { db } from './index'
import { 
  users, 
  schedules, 
  attendances, 
  teams, 
  teamMembers, 
  comments 
} from './schema'
import { eq, and, desc, asc, sql, gte, count } from 'drizzle-orm'
import { nanoid } from 'nanoid'

// ID 생성 함수
export const generateId = () => nanoid()

// User helpers
export async function getUserById(id: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  })
  return result
}

export async function getAllUsers() {
  return db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  })
}

export async function updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
  const result = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  return result[0]
}

// Schedule helpers
export async function getScheduleById(id: string) {
  return db.query.schedules.findFirst({
    where: eq(schedules.id, id),
    with: {
      createdBy: {
        columns: {
          name: true,
          role: true,
        },
      },
      attendances: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              level: true,
            },
          },
          inviter: {
            columns: {
              id: true,
              name: true,
              realName: true,
            },
          },
        },
        orderBy: [asc(attendances.createdAt)],
      },
      comments: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              level: true,
              role: true,
            },
          },
        },
        orderBy: [desc(comments.createdAt)],
      },
    },
  })
}

export async function getSchedules(options: {
  upcoming?: boolean
  limit?: number
  userId?: string
}) {
  const { upcoming, limit = 20, userId } = options
  
  const whereConditions = []
  if (upcoming) {
    whereConditions.push(gte(schedules.date, new Date()))
  }
  
  const result = await db.query.schedules.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: upcoming ? [asc(schedules.date)] : [desc(schedules.date)],
    limit,
    with: {
      createdBy: {
        columns: {
          name: true,
          role: true,
        },
      },
      attendances: userId ? {
        where: and(
          eq(attendances.userId, userId),
          eq(attendances.guestName, sql`null`)
        ),
        columns: {
          status: true,
        },
      } : undefined,
    },
  })
  
  // 참석자 수 추가
  const schedulesWithCount = await Promise.all(
    result.map(async (schedule) => {
      const attendanceCount = await db
        .select({ count: count() })
        .from(attendances)
        .where(
          and(
            eq(attendances.scheduleId, schedule.id),
            eq(attendances.status, 'ATTEND')
          )
        )
      
      const commentCount = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.scheduleId, schedule.id))
      
      return {
        ...schedule,
        _count: {
          attendances: attendanceCount[0]?.count || 0,
          comments: commentCount[0]?.count || 0,
        },
      }
    })
  )
  
  return schedulesWithCount
}

export async function createSchedule(data: Omit<typeof schedules.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const result = await db.insert(schedules)
    .values({
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
  return result[0]
}

export async function updateSchedule(id: string, data: Partial<typeof schedules.$inferInsert>) {
  const result = await db.update(schedules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schedules.id, id))
    .returning()
  return result[0]
}

export async function deleteSchedule(id: string) {
  await db.delete(schedules).where(eq(schedules.id, id))
}

// Attendance helpers
export async function getAttendance(scheduleId: string, userId: string) {
  return db.query.attendances.findFirst({
    where: and(
      eq(attendances.scheduleId, scheduleId),
      eq(attendances.userId, userId),
      eq(attendances.guestName, sql`null`)
    ),
  })
}

export async function createAttendance(data: Omit<typeof attendances.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const result = await db.insert(attendances)
    .values({
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
  return result[0]
}

export async function updateAttendance(id: string, data: Partial<typeof attendances.$inferInsert>) {
  const result = await db.update(attendances)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(attendances.id, id))
    .returning()
  return result[0]
}

export async function deleteAttendance(id: string) {
  await db.delete(attendances).where(eq(attendances.id, id))
}

// Team helpers
export async function getTeamsBySchedule(scheduleId: string) {
  return db.query.teams.findMany({
    where: eq(teams.scheduleId, scheduleId),
    orderBy: [asc(teams.teamNumber)],
    with: {
      members: {
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              realName: true,
              level: true,
            },
          },
        },
      },
    },
  })
}

export async function createTeam(data: Omit<typeof teams.$inferInsert, 'id' | 'createdAt'>) {
  const result = await db.insert(teams)
    .values({
      id: generateId(),
      ...data,
      createdAt: new Date(),
    })
    .returning()
  return result[0]
}

export async function deleteTeamsBySchedule(scheduleId: string) {
  await db.delete(teams).where(eq(teams.scheduleId, scheduleId))
}

export async function createTeamMember(data: Omit<typeof teamMembers.$inferInsert, 'id'>) {
  const result = await db.insert(teamMembers)
    .values({
      id: generateId(),
      ...data,
    })
    .returning()
  return result[0]
}

// Comment helpers
export async function getCommentsBySchedule(scheduleId: string) {
  return db.query.comments.findMany({
    where: eq(comments.scheduleId, scheduleId),
    orderBy: [desc(comments.createdAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          level: true,
          role: true,
        },
      },
    },
  })
}

export async function createComment(data: Omit<typeof comments.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>) {
  const result = await db.insert(comments)
    .values({
      id: generateId(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
  return result[0]
}

// Utility: Count helpers
export async function countAttendances(scheduleId: string, status?: 'ATTEND' | 'ABSENT' | 'PENDING') {
  const conditions = [eq(attendances.scheduleId, scheduleId)]
  if (status) {
    conditions.push(eq(attendances.status, status))
  }
  
  const result = await db
    .select({ count: count() })
    .from(attendances)
    .where(and(...conditions))
  
  return result[0]?.count || 0
}
