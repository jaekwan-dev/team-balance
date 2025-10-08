# 🔄 Drizzle ORM 마이그레이션 가이드

## ✅ 완료된 작업

1. **✅ Drizzle 패키지 설치**
   - `drizzle-orm`
   - `postgres` (PostgreSQL 드라이버)
   - `drizzle-kit` (마이그레이션 도구)
   - `@auth/drizzle-adapter` (NextAuth adapter)

2. **✅ 스키마 작성**
   - `lib/db/schema.ts`: 전체 데이터베이스 스키마
   - 모든 테이블 및 관계 정의 완료

3. **✅ 데이터베이스 연결**
   - `lib/db/index.ts`: Connection pooling 설정
   - Supabase 최적화 (`prepare: false`)

4. **✅ NextAuth Adapter**
   - `lib/auth.ts`: DrizzleAdapter로 변경 완료

5. **✅ 설정 파일**
   - `drizzle.config.ts`: Drizzle Kit 설정
   - `package.json`: 스크립트 업데이트

---

## 🚀 데이터베이스 마이그레이션

### Step 1: 기존 Prisma 마이그레이션 확인

```bash
# 현재 데이터베이스 상태 확인
pnpm prisma db pull
```

### Step 2: Drizzle 스키마 생성

```bash
# Drizzle 스키마에서 마이그레이션 파일 생성
pnpm db:generate
```

### Step 3: 마이그레이션 적용

**중요:** 기존 Prisma로 생성한 테이블이 있다면 Drizzle은 이를 인식합니다.

```bash
# 마이그레이션 적용 (기존 테이블 유지)
pnpm db:push
```

### Step 4: 데이터 확인

```bash
# Drizzle Studio 실행 (데이터 확인용)
pnpm db:studio
```

---

## 📝 API 마이그레이션 전략

### 단계별 마이그레이션

Prisma와 Drizzle을 동시에 사용하면서 점진적으로 마이그레이션:

#### 1. 공통 타입 정의 (`lib/db/types.ts`)

```typescript
// Prisma와 Drizzle 타입 통합
export type { Level, Role, AttendanceStatus } from '@prisma/client'
// 또는
export type { User, Schedule, Attendance } from './schema'
```

#### 2. Helper 함수 작성 (`lib/db/helpers.ts`)

```typescript
import { db } from '@/lib/db'
import { users, schedules, attendances } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// 사용자 조회
export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  })
}

// 일정 목록 조회
export async function getSchedules(limit = 20) {
  return db.query.schedules.findMany({
    orderBy: [desc(schedules.date)],
    limit,
  })
}
```

#### 3. API 라우트 마이그레이션 예시

**Before (Prisma):**
```typescript
import { prisma } from '@/lib/prisma'

const users = await prisma.user.findMany({
  where: { role: 'MEMBER' },
  include: { attendances: true }
})
```

**After (Drizzle):**
```typescript
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const usersList = await db.query.users.findMany({
  where: eq(users.role, 'MEMBER'),
  with: { attendances: true }
})
```

---

## 🛠️ Drizzle 주요 명령어

```bash
# 스키마에서 마이그레이션 생성
pnpm db:generate

# 마이그레이션 적용
pnpm db:migrate

# 스키마 직접 푸시 (개발용)
pnpm db:push

# Drizzle Studio 실행
pnpm db:studio

# 마이그레이션 삭제
pnpm db:drop
```

---

## 📊 Drizzle vs Prisma 비교

### 쿼리 문법 비교

#### SELECT

**Prisma:**
```typescript
await prisma.user.findMany({
  where: { role: 'ADMIN' }
})
```

**Drizzle:**
```typescript
await db.select().from(users).where(eq(users.role, 'ADMIN'))
// 또는
await db.query.users.findMany({
  where: eq(users.role, 'ADMIN')
})
```

#### INSERT

**Prisma:**
```typescript
await prisma.user.create({
  data: { name: 'John', email: 'john@example.com' }
})
```

**Drizzle:**
```typescript
await db.insert(users).values({
  name: 'John',
  email: 'john@example.com'
})
```

#### UPDATE

**Prisma:**
```typescript
await prisma.user.update({
  where: { id: '123' },
  data: { name: 'Jane' }
})
```

**Drizzle:**
```typescript
await db.update(users)
  .set({ name: 'Jane' })
  .where(eq(users.id, '123'))
```

#### DELETE

**Prisma:**
```typescript
await prisma.user.delete({
  where: { id: '123' }
})
```

**Drizzle:**
```typescript
await db.delete(users).where(eq(users.id, '123'))
```

#### JOIN / INCLUDE

**Prisma:**
```typescript
await prisma.schedule.findMany({
  include: {
    attendances: true,
    createdBy: true
  }
})
```

**Drizzle:**
```typescript
await db.query.schedules.findMany({
  with: {
    attendances: true,
    createdBy: true
  }
})
```

---

## 🎯 마이그레이션 우선순위

### 1단계: 인증 및 세션 (완료 ✅)
- `lib/auth.ts` - DrizzleAdapter 적용

### 2단계: 읽기 API (우선)
- `/api/dashboard`
- `/api/members`
- `/api/schedules`
- `/api/user/profile`

### 3단계: 쓰기 API
- `/api/schedules/[scheduleId]/attendance`
- `/api/schedules/[scheduleId]/comments`
- `/api/admin/*`

### 4단계: 복잡한 API
- `/api/schedules/[scheduleId]/teams` (팀 편성)
- 트랜잭션이 필요한 API

---

## 🔧 유용한 Drizzle 패턴

### 트랜잭션

```typescript
await db.transaction(async (tx) => {
  await tx.insert(schedules).values(newSchedule)
  await tx.insert(attendances).values(newAttendance)
})
```

### 서브쿼리

```typescript
const attendanceCount = db.$count(attendances)
  .where(eq(attendances.scheduleId, schedules.id))
```

### 조건부 쿼리

```typescript
import { and, or, eq } from 'drizzle-orm'

const conditions = []
if (status) conditions.push(eq(attendances.status, status))
if (userId) conditions.push(eq(attendances.userId, userId))

await db.select().from(attendances).where(and(...conditions))
```

---

## ⚠️ 주의사항

1. **Connection Pooling**: Supabase에서는 `prepare: false` 필수
2. **트랜잭션**: 복잡한 작업은 트랜잭션 사용
3. **타입 안전성**: Drizzle은 완전한 타입 추론 제공
4. **성능**: Drizzle은 Prisma보다 더 가볍고 빠름

---

## 📚 참고 문서

- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Drizzle + Supabase](https://orm.drizzle.team/docs/get-started-postgresql#supabase)
- [Drizzle + NextAuth](https://authjs.dev/getting-started/adapters/drizzle)
- [마이그레이션 가이드](https://orm.drizzle.team/docs/migrations)

---

**다음 단계:** API 라우트를 하나씩 Drizzle로 마이그레이션하세요!
