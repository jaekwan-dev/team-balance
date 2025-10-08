# 🔧 Cloudflare Pages 빌드 구성

TeamBalance 프로젝트를 Cloudflare Pages에 배포하기 위한 빌드 설정입니다.

## 📋 Cloudflare Dashboard 빌드 설정

### 기본 설정

```
프레임워크 프리셋: Next.js
빌드 명령어: npx @cloudflare/next-on-pages
빌드 출력 디렉토리: .vercel/output/static
루트 디렉토리: (비워두기)
```

### Node.js 버전

```
NODE_VERSION = 18
```

또는 빌드 설정에서:
```
Node version: 18
```

---

## 🔑 환경 변수 (Environment Variables)

Cloudflare Dashboard → **Settings** → **Environment variables**

### Production 환경

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase Connection Pooling |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres` | Direct Connection (마이그레이션용) |
| `NEXTAUTH_URL` | `https://team-balance.pages.dev` | 배포된 URL |
| `NEXTAUTH_SECRET` | `<32자+ 랜덤 문자열>` | NextAuth 암호화 키 |
| `KAKAO_CLIENT_ID` | `<Kakao Client ID>` | Kakao OAuth ID |
| `KAKAO_CLIENT_SECRET` | `<Kakao Secret>` | Kakao OAuth Secret |
| `NODE_VERSION` | `18` | Node.js 버전 |

### Preview 환경 (선택사항)

Preview 환경에는 테스트용 데이터베이스를 별도로 설정할 수 있습니다.

---

## 🚀 배포 방법

### 1. GitHub 연동 배포 (추천)

1. **Cloudflare Dashboard** → **Workers & Pages** → **Create application**
2. **Pages** 탭 → **Connect to Git**
3. GitHub 리포지토리 선택: `team-balance`
4. 위의 빌드 설정 입력
5. 환경 변수 추가
6. **Save and Deploy**

**자동 배포:**
- `main` 브랜치 푸시 시 자동 배포
- Pull Request 생성 시 Preview URL 자동 생성

### 2. Wrangler CLI 배포

**⚠️ Windows 경고:** `@cloudflare/next-on-pages`는 Windows에서 직접 실행 시 bash 에러가 발생할 수 있습니다.

**해결 방법:**
1. **WSL (Windows Subsystem for Linux) 사용 추천**
2. 또는 **Git Bash** 설치 및 PATH 추가
3. 또는 **GitHub 연동 배포 사용 (가장 권장)**

```bash
# WSL 또는 Linux/Mac에서
pnpm build:cf
pnpm pages:deploy
```

---

## 🐛 빌드 에러 해결

### Windows에서 bash 에러

**증상:**
```
Error: spawn bash ENOENT
```

**해결 방법:**

#### 방법 1: WSL 사용 (권장)
```powershell
# PowerShell에서 WSL 설치
wsl --install

# WSL 환경에서 빌드
wsl
cd /mnt/c/Users/jaekw/cursorProjects/team-balance
pnpm build:cf
```

#### 방법 2: Git Bash 사용
1. Git Bash 설치: https://git-scm-com/downloads
2. Git Bash를 PATH에 추가
3. Git Bash에서 빌드 실행

#### 방법 3: GitHub 연동 (가장 쉬움)
로컬 빌드 없이 GitHub에 푸시하면 Cloudflare가 자동으로 빌드합니다.

```bash
git add .
git commit -m "Cloudflare Pages 배포"
git push origin main
```

---

## 📦 빌드 결과물

성공적인 빌드 시:
```
.vercel/output/static/
├── _worker.js          # Cloudflare Worker 코드
├── _routes.json        # 라우팅 설정
└── (기타 정적 파일들)
```

---

## ✅ 배포 후 체크리스트

- [ ] Cloudflare Dashboard에서 빌드 성공 확인
- [ ] 배포 URL 접속 테스트
- [ ] Kakao Developers에 Redirect URI 추가
  - `https://<프로젝트명>.pages.dev/api/auth/callback/kakao`
- [ ] 로그인 테스트
- [ ] 데이터베이스 연결 확인
- [ ] 기본 기능 동작 확인

---

## 🔗 관련 문서

- [Cloudflare Pages - Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages 문서](https://github.com/cloudflare/next-on-pages)
- [Supabase 설정 가이드](./SUPABASE_SETUP.md)
- [전체 배포 가이드](./CLOUDFLARE_DEPLOYMENT.md)

---

**마지막 업데이트:** 2025-01-13

