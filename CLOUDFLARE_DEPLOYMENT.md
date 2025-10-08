# ☁️ Cloudflare Pages 배포 가이드

TeamBalance 프로젝트를 Cloudflare Pages에 배포하는 방법입니다.

## 📋 사전 준비

### 1. Cloudflare 계정
- [Cloudflare Dashboard](https://dash.cloudflare.com) 가입
- Wrangler CLI 로그인 완료 ✅

### 2. 환경 변수 준비
다음 값들을 미리 준비하세요:

```env
# Supabase Database (Connection Pooling)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

NEXTAUTH_URL="https://your-app.pages.dev"
NEXTAUTH_SECRET="<32자 이상 랜덤 문자열>"
KAKAO_CLIENT_ID="your-kakao-id"
KAKAO_CLIENT_SECRET="your-kakao-secret"
```

**Supabase 설정:**
- [Supabase 설정 가이드](./SUPABASE_SETUP.md) 참고
- Connection Pooling 사용 (포트 6543)
- Direct URL 필수 (마이그레이션용)

**NEXTAUTH_SECRET 생성:**
```powershell
# PowerShell에서 실행
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🚀 배포 방법

### 방법 1: GitHub 연동 배포 (추천 ⭐)

#### Step 1: GitHub에 푸시
```bash
git add .
git commit -m "Cloudflare Pages 배포 설정"
git push origin main
```

#### Step 2: Cloudflare Pages 프로젝트 생성
1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. **Workers & Pages** → **Create application** 클릭
3. **Pages** 탭 → **Connect to Git** 선택
4. GitHub 리포지토리 연동 및 선택

#### Step 3: 빌드 설정
```
프레임워크 프리셋: Next.js (Static)
빌드 명령어: npx @cloudflare/next-on-pages
빌드 출력 디렉토리: .vercel/output/static
루트 디렉토리: /
Node.js 버전: 18
```

**중요:** `@cloudflare/next-on-pages`를 사용하여 Next.js를 Cloudflare Workers 호환 형식으로 변환합니다.

#### Step 4: 환경 변수 설정
**Settings** → **Environment variables**에서 추가:

**Production 환경:**
```
DATABASE_URL = postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL = postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NEXTAUTH_URL = https://<프로젝트명>.pages.dev
NEXTAUTH_SECRET = <생성한 랜덤 키>
KAKAO_CLIENT_ID = <Kakao 클라이언트 ID>
KAKAO_CLIENT_SECRET = <Kakao 클라이언트 시크릿>
```

#### Step 5: 배포 시작
**Save and Deploy** 클릭!

---

### 방법 2: CLI로 직접 배포

#### Step 1: 빌드
```bash
pnpm build:cf
```

#### Step 2: Wrangler로 배포
```bash
# 프로젝트 생성 (최초 1회)
pnpm wrangler pages project create team-balance

# 배포
pnpm pages:deploy
```

**빌드 결과:** `.vercel/output/static` 디렉토리에 Cloudflare Workers 호환 빌드가 생성됩니다.

#### Step 3: 환경 변수 설정
```bash
pnpm wrangler pages secret put DATABASE_URL
pnpm wrangler pages secret put DIRECT_URL
pnpm wrangler pages secret put NEXTAUTH_URL
pnpm wrangler pages secret put NEXTAUTH_SECRET
pnpm wrangler pages secret put KAKAO_CLIENT_ID
pnpm wrangler pages secret put KAKAO_CLIENT_SECRET
```

---

## 🔧 빌드 스크립트

프로젝트에 포함된 npm 스크립트:

```bash
# 일반 빌드
pnpm build

# Cloudflare Pages 빌드
pnpm build:cf

# Pages 빌드 (별칭)
pnpm pages:build

# 빌드 + 배포
pnpm pages:deploy

# 로컬에서 Pages 환경 테스트
pnpm pages:dev
```

---

## 🌐 Kakao OAuth 설정 업데이트

배포 후 Kakao Developers Console에서 리다이렉트 URI 추가:

1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 선택
3. **제품 설정** → **카카오 로그인**
4. **Redirect URI** 추가:
   ```
   https://<프로젝트명>.pages.dev/api/auth/callback/kakao
   ```

---

## 🎯 커스텀 도메인 설정 (선택)

### Step 1: 도메인 추가
1. Cloudflare Dashboard → Pages → 프로젝트 선택
2. **Custom domains** 탭
3. **Set up a custom domain** 클릭
4. 도메인 입력 (예: teambalance.com)

### Step 2: DNS 설정
Cloudflare가 자동으로 DNS 레코드를 추가합니다.

### Step 3: 환경 변수 업데이트
**NEXTAUTH_URL**을 새 도메인으로 변경:
```
NEXTAUTH_URL = https://teambalance.com
```

### Step 4: Kakao 리다이렉트 URI 업데이트
```
https://teambalance.com/api/auth/callback/kakao
```

---

## 📊 데이터베이스 설정

### Supabase PostgreSQL (현재 사용 중)

**장점:**
- ✅ PostgreSQL 15 + 추가 기능 (Auth, Storage, Edge Functions)
- ✅ 무료 티어 제공 (500MB 스토리지, 2GB 전송)
- ✅ Connection Pooling 내장 (pgbouncer)
- ✅ 글로벌 CDN 및 엣지 네트워크
- ✅ 실시간 데이터베이스 기능
- ✅ 자동 백업 및 Point-in-Time Recovery

**연결 문자열 형식:**
```bash
# Connection Pooling (앱 사용)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (마이그레이션)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

**Supabase 설정:**
- 상세 가이드: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- 프로젝트 생성: https://supabase.com

**마이그레이션 실행:**
```bash
# 로컬에서 마이그레이션 적용
pnpm db:migrate

# 또는
pnpm prisma migrate deploy
```

---

## 🔍 배포 후 체크리스트

- [ ] 빌드 성공 확인 (Cloudflare Dashboard)
- [ ] 사이트 접속 테스트
- [ ] Kakao 로그인 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 일정 생성/조회 테스트
- [ ] 참석 투표 기능 테스트
- [ ] 팀 편성 기능 테스트

---

## 🐛 문제 해결

### 빌드 실패

**증상:** Cloudflare에서 빌드가 실패함

**해결:**
1. 로컬에서 `pnpm build` 테스트
2. Node.js 버전 확인 (18 사용)
3. 환경 변수 확인

```bash
# 로컬 빌드 테스트
pnpm build

# 빌드 로그 확인
pnpm wrangler pages deployment list
```

### 데이터베이스 연결 오류

**증상:** `PrismaClientInitializationError`

**해결:**
1. DATABASE_URL 형식 확인
2. SSL 모드 포함 확인: `?sslmode=require`
3. Neon에서 IP 화이트리스트 설정 (모두 허용)

```bash
# 환경 변수 확인
pnpm wrangler pages secret list
```

### NextAuth 오류

**증상:** 로그인 리다이렉트 실패

**해결:**
1. NEXTAUTH_URL이 정확한 배포 URL인지 확인
2. NEXTAUTH_SECRET이 설정되었는지 확인
3. Kakao 리다이렉트 URI 확인

### 이미지 로딩 실패

**증상:** Kakao 프로필 이미지가 안 보임

**해결:**
- `next.config.ts`에 Kakao CDN 도메인 추가됨 확인
- 이미 설정되어 있음: `k.kakaocdn.net`, `t1.kakaocdn.net`

---

## 📈 성능 최적화

### 1. Caching
Cloudflare Pages는 자동으로 정적 파일을 CDN에 캐싱합니다.

### 2. Edge Functions
모든 API 라우트가 Cloudflare Edge에서 실행됩니다.

### 3. Analytics
**Dashboard** → **Analytics**에서 트래픽 확인 가능

---

## 🔄 CI/CD 자동 배포

GitHub 연동 시 자동 설정:

- **Production**: `main` 브랜치 푸시 시 자동 배포
- **Preview**: Pull Request 생성 시 미리보기 URL 자동 생성
- **Rollback**: Dashboard에서 이전 배포로 즉시 롤백 가능

---

## 📊 모니터링

### 실시간 로그 확인
```bash
pnpm wrangler pages deployment tail
```

### 배포 이력 확인
```bash
pnpm wrangler pages deployment list
```

### 환경 변수 확인
```bash
pnpm wrangler pages secret list
```

---

## 🔗 유용한 링크

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)
- [Neon PostgreSQL](https://neon.tech/docs/introduction)
- [NextAuth.js 문서](https://next-auth.js.org/)

---

## 💡 팁

1. **Preview 배포 활용**: PR마다 미리보기 URL이 생성되므로 테스트에 활용
2. **환경 변수 분리**: Production과 Preview 환경 변수를 분리하여 관리
3. **로그 모니터링**: `wrangler pages deployment tail`로 실시간 로그 확인
4. **롤백**: 문제 발생 시 Dashboard에서 즉시 이전 버전으로 복구 가능

---

**문의사항이나 문제가 있으면 Cloudflare Community 또는 프로젝트 이슈에 등록해주세요!**

마지막 업데이트: 2025-01-13
