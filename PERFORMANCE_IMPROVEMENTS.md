# 🚀 Performance Improvement Plan

## 현재 문제점

### 1. 데이터베이스 쿼리 성능
- **N+1 쿼리 문제**: 각 일정마다 개별 count 쿼리 실행
- **순차 실행**: 총 19개의 쿼리가 순차적으로 실행
- **과도한 조회**: 불필요한 데이터까지 모두 로드
- **캐싱 없음**: 정적 데이터도 매번 DB 조회

### 2. 네트워크 지연
- **데이터베이스 위치**: Supabase (AWS ap-northeast-1, 도쿄)
- **Vercel 배포**: 글로벌 엣지, 하지만 DB는 도쿄에만 존재
- **왕복 시간**: 각 쿼리마다 네트워크 지연 발생

### 3. 프론트엔드 성능
- **SSR 없음**: 모든 데이터가 클라이언트에서 fetch
- **로딩 상태 부족**: 사용자 경험이 느리게 느껴짐
- **번들 크기**: 최적화되지 않은 클라이언트 번들

---

## 🎯 개선 전략

### Phase 1: 즉시 개선 가능 (Backend)

#### 1.1 쿼리 최적화 - 병렬 처리
```typescript
// Before: 순차 실행 (19개 쿼리)
const nextSchedule = await getNextSchedule()
const upcomingSchedules = await getUpcoming()
const stats = await getStats()

// After: 병렬 실행 (동시에 처리)
const [nextSchedule, upcomingSchedules, stats] = await Promise.all([
  getNextSchedule(),
  getUpcoming(),
  getStats()
])
```

#### 1.2 N+1 문제 해결 - Aggregation
```typescript
// Before: 각 일정마다 개별 count 쿼리
for (const schedule of schedules) {
  const count = await db.select({ count: count() })...
}

// After: 한 번에 모든 count 조회
const counts = await db
  .select({
    scheduleId: attendances.scheduleId,
    count: count()
  })
  .from(attendances)
  .where(in(attendances.scheduleId, scheduleIds))
  .groupBy(attendances.scheduleId)
```

#### 1.3 불필요한 데이터 제거
```typescript
// 필요한 컬럼만 select
columns: {
  id: true,
  name: true,
  // image, email 등 불필요한 필드 제외
}
```

---

### Phase 2: 캐싱 전략

#### 2.1 Next.js Revalidation
```typescript
// Static data caching (5분)
export const revalidate = 300

// ISR (Incremental Static Regeneration)
export async function generateStaticParams() {
  // Pre-render common pages
}
```

#### 2.2 SWR (Stale-While-Revalidate)
```typescript
import useSWR from 'swr'

// 클라이언트 캐싱
const { data, error } = useSWR('/api/dashboard', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1분
})
```

#### 2.3 Redis 캐싱 (선택적)
- Upstash Redis (Serverless)
- 자주 조회되는 데이터 캐싱
- 실시간 업데이트 필요 없는 데이터

---

### Phase 3: 프론트엔드 최적화

#### 3.1 로딩 상태 개선
```typescript
// Skeleton UI
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>

// Progressive Loading
- 먼저 중요한 데이터 로드
- 나머지는 백그라운드에서 로드
```

#### 3.2 코드 스플리팅
```typescript
// Dynamic Import
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
})
```

#### 3.3 이미지 최적화
```typescript
// Next.js Image Component
import Image from 'next/image'

<Image
  src={user.image}
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
/>
```

---

### Phase 4: 아키텍처 개선 (장기)

#### 4.1 데이터베이스 마이그레이션
**현재**: Supabase (PostgreSQL, 도쿄)
**문제**: 단일 리전, 네트워크 지연

**옵션 A: Vercel Postgres** ⭐ (추천)
- ✅ Vercel Edge Network와 통합
- ✅ 글로벌 Read Replicas
- ✅ 자동 스케일링
- ✅ 무료 티어 (512MB)
- ❌ 용량 제한

**옵션 B: PlanetScale** ⭐⭐ (강력 추천)
- ✅ 글로벌 분산 데이터베이스
- ✅ Serverless MySQL
- ✅ 자동 샤딩 및 복제
- ✅ Vitess 기반 (YouTube 사용)
- ✅ Prisma/Drizzle 완벽 지원
- ✅ 무료 티어 (10GB)

**옵션 C: Neon** 
- ✅ Serverless PostgreSQL
- ✅ Auto-scaling
- ✅ 무료 티어 충분
- ⚠️ 아직 단일 리전

#### 4.2 Edge Functions
```typescript
// Vercel Edge Runtime
export const runtime = 'edge'

// 글로벌 엣지에서 실행
// DB 연결은 HTTP-based (Neon, PlanetScale)
```

#### 4.3 API 라우트 최적화
```typescript
// Route Handlers with Streaming
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const data = await fetchData()
      controller.enqueue(encoder.encode(JSON.stringify(data)))
      controller.close()
    }
  })
  
  return new Response(stream)
}
```

---

## 📊 예상 성능 개선

### Before (현재)
- Dashboard 로딩: ~2-3초
- 페이지 전환: ~1-2초
- DB 쿼리: 19개 (순차)
- 총 응답 시간: ~2000-3000ms

### After (Phase 1 적용)
- Dashboard 로딩: ~800-1200ms (60% 개선)
- 페이지 전환: ~500ms (50% 개선)
- DB 쿼리: 5-7개 (병렬)
- 총 응답 시간: ~800-1200ms

### After (Phase 1+2 적용)
- Dashboard 로딩: ~300-500ms (85% 개선)
- 페이지 전환: ~200ms (80% 개선)
- 캐시 히트 시: ~50-100ms
- 총 응답 시간: ~300-500ms

### After (Phase 1+2+4 적용 - PlanetScale)
- Dashboard 로딩: ~200-300ms (90% 개선)
- 페이지 전환: ~100-200ms (90% 개선)
- 글로벌 엣지: ~50-100ms
- 총 응답 시간: ~200-300ms

---

## 🛠 구현 우선순위

### 🔥 High Priority (즉시)
1. ✅ DB 쿼리 병렬 처리
2. ✅ N+1 문제 해결
3. ✅ 불필요한 데이터 제거
4. ✅ 로딩 상태 개선

### 🟡 Medium Priority (1주일)
5. ⏳ Next.js 캐싱 전략
6. ⏳ SWR 클라이언트 캐싱
7. ⏳ 코드 스플리팅
8. ⏳ 이미지 최적화

### 🔵 Low Priority (장기)
9. ⏸️ PlanetScale 마이그레이션
10. ⏸️ Edge Runtime 전환
11. ⏸️ Redis 캐싱

---

## 💰 비용 분석

### 현재 (Supabase)
- 무료 티어: 500MB, 2GB 전송
- 비용: $0/월

### PlanetScale (추천)
- 무료 티어: 10GB, 1B row reads/월
- Pro: $29/월 (100GB, 무제한 reads)
- 비용: $0/월 (무료 티어로 충분)

### Vercel Postgres
- 무료 티어: 512MB, 60시간 compute
- Pro: $20/월 (20GB)
- 비용: $0/월 또는 $20/월

### Upstash Redis (선택)
- 무료 티어: 10K 명령/일
- 비용: $0/월 (무료 티어로 충분)

---

## 🎯 최종 추천 아키텍처

```
┌─────────────┐
│   Vercel    │ ← 글로벌 Edge CDN
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐ ┌───▼────────┐
│ PlanetScale │ │  Upstash   │
│  (MySQL)    │ │   Redis    │
│  글로벌 복제  │ │  (캐싱)    │
└─────────────┘ └────────────┘
```

### 장점
- ✅ 전 세계 어디서나 빠른 응답
- ✅ 자동 스케일링
- ✅ 무료 티어로 충분
- ✅ 개발자 경험 우수
- ✅ 프로덕션 ready

---

## 📝 다음 단계

1. **Phase 1 즉시 구현**: DB 쿼리 최적화
2. **성능 측정**: Before/After 비교
3. **Phase 2 구현**: 캐싱 전략
4. **PlanetScale 검토**: 마이그레이션 계획

**즉시 시작하시겠습니까?**

