# 🗄️ Supabase 데이터베이스 설정 가이드

## 📋 Supabase vs Neon 비교

| 기능 | Supabase | Neon |
|------|----------|------|
| 데이터베이스 | PostgreSQL 15 | PostgreSQL 16 |
| 무료 티어 | 500MB, 2GB 전송 | 0.5GB, 무제한 전송 |
| 추가 기능 | Auth, Storage, Edge Functions | Branching, Autoscaling |
| 글로벌 엣지 | ✅ | ✅ |
| Prisma 호환 | ✅ | ✅ |

## 🚀 Supabase 프로젝트 생성

### Step 1: Supabase 계정 생성
1. https://supabase.com 접속
2. **Start your project** 클릭
3. GitHub 또는 이메일로 가입

### Step 2: 새 프로젝트 생성
1. **New Project** 클릭
2. 프로젝트 정보 입력:
   ```
   Name: team-balance
   Database Password: <강력한 비밀번호 생성>
   Region: Northeast Asia (Seoul)
   Pricing Plan: Free
   ```
3. **Create new project** 클릭 (약 2분 소요)

### Step 3: 데이터베이스 연결 정보 가져오기
1. 프로젝트 Dashboard → **Settings** → **Database**
2. **Connection string** 섹션에서:
   - **Connection pooling** 탭 선택
   - **Mode**: Transaction
   - **URI** 복사

**연결 문자열 형식:**
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

---

## 🔧 프로젝트 설정

### 1. 환경 변수 업데이트 (.env.local)

```env
# Supabase Database (Connection Pooling)
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Kakao OAuth
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"
```

**중요:**
- `DATABASE_URL`: Connection Pooling (포트 6543, pgbouncer=true)
- `DIRECT_URL`: Direct Connection (포트 5432, 마이그레이션용)

### 2. Prisma 스키마 업데이트

이미 `schema.prisma`에 설정되어 있습니다:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 📊 데이터베이스 마이그레이션

### 초기 마이그레이션 실행

```bash
# 1. Prisma Client 생성
pnpm db:generate

# 2. 마이그레이션 실행
pnpm db:migrate

# 또는 개발 환경에서
pnpm prisma migrate dev
```

---

## 🌐 Cloudflare Pages 환경 변수

### Cloudflare Dashboard 설정

**Settings** → **Environment variables**에 추가:

#### Production 환경
```env
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

NEXTAUTH_URL=https://your-app.pages.dev
NEXTAUTH_SECRET=<your-secret-key>
KAKAO_CLIENT_ID=<your-id>
KAKAO_CLIENT_SECRET=<your-secret>
```

#### Preview 환경 (선택사항)
동일한 설정을 사용하거나, 별도의 Preview 데이터베이스 생성

---

## 🔐 Supabase 보안 설정

### 1. Connection Pooling 활성화 (이미 활성화됨)
- Transaction 모드 사용 (Prisma 최적화)
- 포트 6543 사용

### 2. SSL 모드
Supabase는 자동으로 SSL 연결을 사용합니다.

### 3. IP 화이트리스트 (선택사항)
- Dashboard → Settings → Database
- **Allow all IP addresses** (Cloudflare Pages용)

---

## ✅ 연결 테스트

### 로컬 테스트

```bash
# 데이터베이스 연결 확인
pnpm prisma db pull

# 마이그레이션 상태 확인
pnpm prisma migrate status

# Prisma Studio로 데이터 확인
pnpm prisma studio
```

### 샘플 데이터 생성 (선택사항)

```bash
node scripts/create-sample-data.js
```

---

## 🎯 Supabase 추가 기능 활용 (선택사항)

### 1. Supabase Auth (NextAuth 대체)
NextAuth 대신 Supabase Auth를 사용할 수 있습니다.

### 2. Storage
파일 업로드가 필요한 경우:
```bash
pnpm add @supabase/supabase-js
```

### 3. Edge Functions
서버리스 함수가 필요한 경우 활용

### 4. Realtime
실시간 업데이트가 필요한 경우:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 🐛 문제 해결

### 연결 오류: "too many connections"

**원인:** Connection pooling 미사용

**해결:**
- `DATABASE_URL`에 포트 6543 사용
- `?pgbouncer=true` 파라미터 추가

### 마이그레이션 오류: "prepared statement already exists"

**원인:** Connection pooling에서 마이그레이션 실행

**해결:**
- `DIRECT_URL` 사용 (포트 5432)
- `schema.prisma`에 `directUrl` 설정 확인

### SSL 인증서 오류

**해결:**
- 연결 문자열에 `?sslmode=require` 추가 (보통 불필요)

---

## 📚 유용한 링크

- [Supabase 문서](https://supabase.com/docs)
- [Prisma + Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase Dashboard](https://app.supabase.com)

---

## 💡 팁

1. **Connection Pooling 필수**: Serverless 환경에서는 항상 pooling 사용
2. **Direct URL**: 마이그레이션용으로 별도 설정
3. **Region 선택**: Seoul 리전 선택 시 낮은 레이턴시
4. **백업**: Supabase는 자동 백업 제공 (Pro 플랜)
5. **모니터링**: Dashboard에서 Query 성능 모니터링 가능

---

**설정 완료 후 로컬에서 `pnpm dev`로 테스트하세요!** 🚀
