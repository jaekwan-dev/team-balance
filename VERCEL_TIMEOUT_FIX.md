# Vercel Timeout 해결 가이드

## 문제
- **Vercel Runtime Timeout Error: Task timed out after 300 seconds**
- Dashboard API가 5분 동안 응답하지 않음

## 원인 분석

### 1. Vercel Function 제한
- **Hobby Plan**: 10초 최대 실행 시간
- **Pro Plan**: 60초 최대 실행 시간
- **Enterprise**: 300초 최대 실행 시간

300초 타임아웃은 **Enterprise 플랜**에서만 발생 가능합니다.

### 2. 가능한 원인
1. **데이터베이스 연결 실패**
   - Supabase Connection Pooling URL이 잘못됨
   - 방화벽/네트워크 문제
   - DB 서버 다운

2. **무한 대기 상태**
   - DB 연결 타임아웃 미설정
   - 쿼리 타임아웃 미설정
   - Dead lock

3. **N+1 쿼리 문제**
   - 너무 많은 순차적 쿼리
   - 최적화 미적용

## 적용된 해결책

### 1. DB 연결 타임아웃 설정
```typescript
// lib/db/index.ts
const queryClient = postgres(connectionString, {
  prepare: false,
  max: 1,
  onnotice: () => {},
  idle_timeout: 20,        // 20초 후 유휴 연결 종료
  connect_timeout: 10,     // 10초 연결 타임아웃
  max_lifetime: 60 * 30,   // 30분 최대 연결 수명
})
```

### 2. Function 실행 시간 제한
```typescript
// app/api/dashboard/route.ts
export const maxDuration = 60 // 최대 60초
```

### 3. 쿼리 최적화
- ✅ 병렬 쿼리 실행 (Promise.all)
- ✅ N+1 문제 해결 (groupBy 사용)
- ✅ 필요한 컬럼만 선택
- ✅ 인덱스 활용

### 4. 실행 시간 로깅
```typescript
const startTime = Date.now()
// ... queries ...
const executionTime = Date.now() - startTime
console.log(`[Dashboard] Query completed in ${executionTime}ms`)
```

## Vercel 환경 변수 확인

### 필수 환경 변수
1. **DATABASE_URL**
   - Supabase Connection Pooling URL (포트 6543)
   - 형식: `postgresql://[user]:[password]@[host]:6543/[database]?pgbouncer=true&connection_limit=1`

2. **DIRECT_URL** (마이그레이션용)
   - Supabase Direct Connection URL (포트 5432)
   - 형식: `postgresql://[user]:[password]@[host]:5432/[database]`

3. **NEXTAUTH_URL**
   - 배포된 URL (예: `https://your-app.vercel.app`)

4. **NEXTAUTH_SECRET**
   - 랜덤 시크릿 (최소 32자)
   - 생성: `openssl rand -base64 32`

5. **KAKAO_CLIENT_ID** & **KAKAO_CLIENT_SECRET**

### Vercel Dashboard에서 설정
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. 모든 환경 변수 추가 (Production, Preview, Development)
4. **Save** 후 **Redeploy**

## 디버깅 방법

### 1. Vercel 로그 확인
```bash
vercel logs [deployment-url]
```

### 2. 로컬 테스트
```bash
pnpm build
pnpm start
```

### 3. 실행 시간 확인
Vercel Function Logs에서 다음 로그 확인:
- `[Dashboard] Starting query for user: [userId]`
- `[Dashboard] Query completed in [ms]ms`
- `[Dashboard] Error after [ms]ms: [error]`

## 긴급 해결책 (타임아웃 계속 발생 시)

### Option 1: 캐싱 강화
```typescript
// app/api/dashboard/route.ts
export const revalidate = 60 // 1분마다 재검증 (더 공격적)

// 또는 Static Generation
export const dynamic = 'force-static'
```

### Option 2: 데이터 페이지네이션
```typescript
// 최근 활동을 5개 → 3개로 감소
limit: 3,
```

### Option 3: Edge Runtime 전환 (Drizzle 전용)
```typescript
export const runtime = 'edge' // Cloudflare 호환
```
⚠️ 주의: NextAuth는 Node.js Runtime 필요

### Option 4: Vercel Pro 플랜 업그레이드
- 60초 실행 시간
- 더 많은 동시 실행
- 더 나은 성능

## 추천 순서

1. ✅ **DB 연결 타임아웃 설정** (완료)
2. ✅ **maxDuration 설정** (완료)
3. ✅ **로깅 추가** (완료)
4. 🔄 **Vercel 환경 변수 확인**
5. 🔄 **Redeploy**
6. 🔄 **Vercel Logs 확인**
7. 필요시 캐싱 강화 또는 Pro 플랜 고려

## 예상 실행 시간

최적화된 상태:
- **로컬**: 200-500ms
- **Vercel (Cold Start)**: 1-3초
- **Vercel (Warm)**: 500ms-1초

5분(300초) 타임아웃은 **명백한 DB 연결 문제**입니다.

