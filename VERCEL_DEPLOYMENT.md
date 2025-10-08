# 🚀 Vercel 배포 가이드

TeamBalance 프로젝트를 Vercel에 배포하는 방법입니다.

## 왜 Vercel인가?

- ✅ Next.js 제작사 플랫폼 (완벽한 호환성)
- ✅ Prisma 완벽 지원
- ✅ NextAuth.js 완벽 지원
- ✅ 무료 티어 (Hobby Plan)
- ✅ 자동 배포 (GitHub 연동)
- ✅ Preview URL (PR마다)
- ✅ 글로벌 CDN
- ✅ Edge Functions 지원

## 📋 사전 준비

### 1. Vercel 계정
- [Vercel](https://vercel.com) 가입
- GitHub 계정 연동

### 2. 환경 변수 준비
```env
# Supabase Database
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="<32자+ 랜덤 문자열>"

# Kakao OAuth
KAKAO_CLIENT_ID="<Kakao Client ID>"
KAKAO_CLIENT_SECRET="<Kakao Client Secret>"
```

---

## 🚀 배포 방법

### 방법 1: Vercel Dashboard (권장)

#### Step 1: Vercel에 로그인
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. GitHub 계정으로 로그인

#### Step 2: 프로젝트 Import
1. **Add New...** → **Project** 클릭
2. **Import Git Repository** 선택
3. `team-balance` 리포지토리 선택
4. **Import** 클릭

#### Step 3: 프로젝트 설정
```
Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
Node.js Version: 18.x
```

**자동 감지됩니다!** 수정할 필요 없음

#### Step 4: 환경 변수 추가
**Environment Variables** 섹션에서 추가:

| 이름 | 값 | 환경 |
|------|-----|------|
| `DATABASE_URL` | `postgresql://...6543/postgres?pgbouncer=true` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://...5432/postgres` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://team-balance.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `<32자+ 랜덤 키>` | Production, Preview, Development |
| `KAKAO_CLIENT_ID` | `<Kakao ID>` | Production, Preview, Development |
| `KAKAO_CLIENT_SECRET` | `<Kakao Secret>` | Production, Preview, Development |

**중요:** 
- Production 환경의 `NEXTAUTH_URL`은 실제 배포 URL로 설정
- Preview/Development는 비워두거나 로컬 URL 사용

#### Step 5: 배포
**Deploy** 버튼 클릭!

---

### 방법 2: Vercel CLI

#### Step 1: CLI 설치 및 로그인
```bash
pnpm add -g vercel
vercel login
```

#### Step 2: 프로젝트 링크
```bash
vercel link
```

질문에 답변:
- Set up and deploy "~/team-balance"? **Yes**
- Which scope? **개인 계정 선택**
- Link to existing project? **No**
- Project name? **team-balance**

#### Step 3: 환경 변수 설정
```bash
# Production 환경 변수 추가
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add KAKAO_CLIENT_ID production
vercel env add KAKAO_CLIENT_SECRET production
```

각 명령 실행 시 값 입력

#### Step 4: 배포
```bash
# Production 배포
vercel --prod

# Preview 배포
vercel
```

---

## 🔧 자동 배포 설정

GitHub 연동 시 자동 배포:

- **Production**: `main` 브랜치 푸시 시
- **Preview**: Pull Request 생성 시
- **Development**: 기타 브랜치 푸시 시

### GitHub Actions 불필요
Vercel이 자동으로 감지하고 배포합니다.

---

## 🌐 Kakao OAuth 설정

### Step 1: 배포 URL 확인
Vercel 배포 완료 후 URL 확인:
```
https://team-balance.vercel.app
```

또는 커스텀 도메인:
```
https://yourdomain.com
```

### Step 2: Kakao Developers 설정
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 애플리케이션 선택
3. **제품 설정** → **카카오 로그인**
4. **Redirect URI** 추가:
```
https://team-balance.vercel.app/api/auth/callback/kakao
```

### Step 3: NEXTAUTH_URL 업데이트
Vercel Dashboard → **Settings** → **Environment Variables**
```
NEXTAUTH_URL = https://team-balance.vercel.app
```

변경 후 **Redeploy** 필요

---

## 🎯 커스텀 도메인 설정

### Step 1: 도메인 추가
1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Domains**
3. **Add** 클릭
4. 도메인 입력 (예: `teambalance.com`)

### Step 2: DNS 설정
Vercel이 제공하는 DNS 레코드를 도메인 제공자에 추가:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME Record (www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Step 3: 환경 변수 업데이트
```
NEXTAUTH_URL = https://teambalance.com
```

### Step 4: Kakao Redirect URI 업데이트
```
https://teambalance.com/api/auth/callback/kakao
```

---

## 📊 모니터링 & 로그

### 실시간 로그
Vercel Dashboard → 프로젝트 → **Logs**

### Analytics
Vercel Dashboard → 프로젝트 → **Analytics**

### 성능 모니터링
Vercel Dashboard → 프로젝트 → **Speed Insights**

---

## 🐛 문제 해결

### 빌드 실패

**증상:** `pnpm build` 실패

**해결:**
1. 로컬에서 빌드 테스트:
   ```bash
   pnpm build
   ```
2. 환경 변수 확인
3. Node.js 버전 확인 (18.x)

### 데이터베이스 연결 오류

**증상:** `PrismaClientInitializationError`

**해결:**
1. `DATABASE_URL` 환경 변수 확인
2. Supabase Connection Pooling URL 사용 (포트 6543)
3. `?pgbouncer=true` 파라미터 확인

### NextAuth 오류

**증상:** 로그인 리다이렉트 실패

**해결:**
1. `NEXTAUTH_URL`이 실제 배포 URL과 일치하는지 확인
2. `NEXTAUTH_SECRET` 설정 확인
3. Kakao Redirect URI 확인

---

## 💡 베스트 프랙티스

### 1. 환경별 변수 관리
- Production: 실제 배포 URL
- Preview: 자동 생성된 Preview URL 사용
- Development: 로컬 URL (`http://localhost:3000`)

### 2. 시크릿 관리
- **절대** 코드에 시크릿 포함하지 않기
- 환경 변수로만 관리
- Git에 `.env` 파일 커밋하지 않기

### 3. Preview 배포 활용
- PR마다 Preview URL 생성
- 테스트 후 Merge
- 자동 Production 배포

### 4. 롤백
- Vercel Dashboard에서 이전 배포로 즉시 롤백 가능
- **Deployments** → 이전 배포 선택 → **Promote to Production**

---

## 📈 성능 최적화

### 1. Edge Functions
일부 API를 Edge Runtime으로 변경 가능:
```typescript
export const runtime = 'edge'
```

### 2. Image Optimization
Vercel Image Optimization 자동 적용

### 3. Caching
`next.config.ts`에서 캐싱 설정

---

## 🔗 유용한 링크

- [Vercel 문서](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [환경 변수 관리](https://vercel.com/docs/projects/environment-variables)
- [커스텀 도메인](https://vercel.com/docs/projects/domains)

---

## ✅ 배포 체크리스트

- [ ] Vercel 프로젝트 생성
- [ ] GitHub 리포지토리 연동
- [ ] 환경 변수 설정
- [ ] 첫 배포 성공
- [ ] 사이트 접속 테스트
- [ ] Kakao OAuth Redirect URI 추가
- [ ] 로그인 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 기본 기능 테스트
- [ ] 커스텀 도메인 설정 (선택)

---

**Vercel 배포가 가장 쉽고 안정적인 방법입니다!**

**마지막 업데이트:** 2025-01-13

