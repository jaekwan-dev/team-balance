# ⚡ Cloudflare Pages 빠른 배포 가이드

## 🚀 3분 안에 배포하기

### Step 1: GitHub에 푸시 (1분)
```bash
git add .
git commit -m "Cloudflare Pages 배포"
git push origin main
```

### Step 2: Cloudflare 설정 (1분)
1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **Create application**
3. **Pages** → **Connect to Git**
4. 리포지토리 선택 후 다음 설정:

```
Framework: Next.js
Build command: pnpm build
Output directory: .next
Node version: 18
```

### Step 3: 환경 변수 설정 (1분)
**Settings** → **Environment variables**에 추가:

```env
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[REF]:[PASSWORD]@...pooler.supabase.com:5432/postgres
NEXTAUTH_URL=https://<프로젝트명>.pages.dev
NEXTAUTH_SECRET=<생성한 랜덤 키>
KAKAO_CLIENT_ID=<Kakao ID>
KAKAO_CLIENT_SECRET=<Kakao Secret>
```

**Supabase 설정:** [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 참고

**NEXTAUTH_SECRET 생성:**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Step 4: 배포! ✨
**Save and Deploy** 클릭하면 끝!

---

## 📝 배포 후 할 일

### 1. Kakao OAuth 리다이렉트 URI 추가
[Kakao Developers](https://developers.kakao.com)에서:
```
https://<프로젝트명>.pages.dev/api/auth/callback/kakao
```

### 2. 테스트
- ✅ 사이트 접속
- ✅ 로그인
- ✅ 일정 생성
- ✅ 팀 편성

---

## 🎯 유용한 명령어

```bash
# 빌드 테스트
pnpm build

# Cloudflare에 직접 배포
pnpm pages:deploy

# 로컬에서 Cloudflare 환경 테스트
pnpm pages:dev
```

---

## 📚 더 자세한 가이드

전체 배포 가이드는 [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) 참고!

---

**Happy Deploying! 🎉**
