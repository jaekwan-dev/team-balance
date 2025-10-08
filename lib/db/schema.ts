import { pgTable, text, timestamp, integer, boolean, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const roleEnum = pgEnum('Role', ['ADMIN', 'MEMBER'])
export const levelEnum = pgEnum('Level', [
  'PRO',
  'SEMI_PRO_1',
  'SEMI_PRO_2',
  'SEMI_PRO_3',
  'AMATEUR_1',
  'AMATEUR_2',
  'AMATEUR_3',
  'AMATEUR_4',
  'AMATEUR_5',
  'BEGINNER_1',
  'BEGINNER_2',
  'BEGINNER_3',
  'ROOKIE'
])
export const attendanceStatusEnum = pgEnum('AttendanceStatus', ['ATTEND', 'ABSENT', 'PENDING'])

// Tables
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  providerProviderAccountIdUnique: uniqueIndex('accounts_provider_provider_account_id_key')
    .on(table.provider, table.providerAccountId),
}))

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verificationtokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  identifierTokenUnique: uniqueIndex('verificationtokens_identifier_token_key')
    .on(table.identifier, table.token),
}))

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  kakaoId: text('kakao_id').unique(),
  name: text('name'),
  realName: text('real_name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  phone: text('phone'),
  level: levelEnum('level').notNull().default('ROOKIE'),
  role: roleEnum('role').notNull().default('MEMBER'),
  isProfileComplete: boolean('is_profile_complete').notNull().default(false),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
})

export const schedules = pgTable('schedules', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  location: text('location').notNull(),
  description: text('description'),
  createdById: text('created_by_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  maxParticipants: integer('max_participants'),
})

export const attendances = pgTable('attendances', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestName: text('guest_name'),
  guestLevel: levelEnum('guest_level'),
  invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
  status: attendanceStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
})

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  teamNumber: integer('team_number').notNull(),
  totalScore: integer('total_score').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  scheduleTeamNumberUnique: uniqueIndex('teams_schedule_id_team_number_key')
    .on(table.scheduleId, table.teamNumber),
}))

export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestName: text('guest_name'),
  guestLevel: levelEnum('guest_level'),
  levelScore: integer('level_score').notNull(),
})

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  attendances: many(attendances),
  invitedAttendances: many(attendances, { relationName: 'invitedAttendances' }),
  comments: many(comments),
  createdSchedules: many(schedules),
  teamMembers: many(teamMembers),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [schedules.createdById],
    references: [users.id],
  }),
  attendances: many(attendances),
  comments: many(comments),
  teams: many(teams),
}))

export const attendancesRelations = relations(attendances, ({ one }) => ({
  schedule: one(schedules, {
    fields: [attendances.scheduleId],
    references: [schedules.id],
  }),
  user: one(users, {
    fields: [attendances.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [attendances.invitedBy],
    references: [users.id],
    relationName: 'invitedAttendances',
  }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [teams.scheduleId],
    references: [schedules.id],
  }),
  members: many(teamMembers),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  schedule: one(schedules, {
    fields: [comments.scheduleId],
    references: [schedules.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}))

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Schedule = typeof schedules.$inferSelect
export type NewSchedule = typeof schedules.$inferInsert
export type Attendance = typeof attendances.$inferSelect
export type NewAttendance = typeof attendances.$inferInsert
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert
export type TeamMember = typeof teamMembers.$inferSelect
export type NewTeamMember = typeof teamMembers.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
