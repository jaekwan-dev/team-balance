# Fly.io 배포 가이드

## 사전 준비사항

1. **Fly.io CLI 설치**
   ```powershell
   # Windows PowerShell에서 실행
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Fly.io 계정 로그인**
   ```powershell
   fly auth login
   ```

## 환경변수 설정

다음 환경변수들을 Fly.io에 설정해야 합니다:

```powershell
# 데이터베이스 URL (PostgreSQL)
fly secrets set DATABASE_URL="postgresql://username:password@hostname:port/database_name"

# NextAuth.js 설정
fly secrets set NEXTAUTH_SECRET="your-secret-key-here"
fly secrets set NEXTAUTH_URL="https://your-app-name.fly.dev"

# Kakao OAuth 설정
fly secrets set KAKAO_CLIENT_ID="your-kakao-client-id"
fly secrets set KAKAO_CLIENT_SECRET="your-kakao-client-secret"

# 환경 설정
fly secrets set NODE_ENV="production"
```

## 배포 단계

1. **앱 생성 및 초기 설정**
   ```powershell
   # 앱 생성 (fly.toml 파일이 있으므로 이름은 자동으로 설정됨)
   fly launch --no-deploy
   
   # 또는 기존 설정으로 바로 배포
   fly launch
   ```

2. **데이터베이스 마이그레이션**
   ```powershell
   # 배포 시 자동으로 실행되지만, 수동으로도 가능
   fly ssh console -C "pnpm prisma migrate deploy"
   ```

3. **배포**
   ```powershell
   fly deploy
   ```

## 주요 설정 사항

### fly.toml 설정
- **리전**: `nrt` (도쿄) - 한국에서 가장 가까운 리전
- **메모리**: 1GB
- **CPU**: 공유 1코어
- **자동 스케일링**: 활성화 (최소 0대, 필요시 자동 시작)

### Docker 설정
- Node.js 20 Alpine 이미지 사용
- pnpm 패키지 매니저 사용
- 멀티스테이지 빌드로 이미지 크기 최적화
- Prisma 클라이언트 포함

### 헬스체크
- HTTP 헬스체크: `/api/health`
- TCP 체크도 함께 설정
- 10초 간격으로 체크

## 유용한 명령어

```powershell
# 앱 상태 확인
fly status

# 로그 확인
fly logs

# SSH 접속
fly ssh console

# 앱 재시작
fly restart

# 스케일 조정
fly scale count 2

# 환경변수 확인
fly secrets list

# 앱 삭제 (주의!)
fly destroy
```

## 문제 해결

### 빌드 실패 시
1. 로컬에서 `pnpm build` 실행하여 빌드 오류 확인
2. Dockerfile의 Node.js 버전 확인
3. 의존성 설치 문제인지 확인

### 데이터베이스 연결 실패 시
1. DATABASE_URL 환경변수 확인
2. 데이터베이스 서버 접근 권한 확인
3. Prisma 마이그레이션 상태 확인

### 인증 문제 시
1. NEXTAUTH_URL이 올바른 도메인으로 설정되었는지 확인
2. Kakao OAuth 설정에서 리다이렉트 URL 업데이트
3. NEXTAUTH_SECRET이 설정되었는지 확인

## 성능 최적화

1. **이미지 최적화**: Next.js의 이미지 최적화 기능 활용
2. **캐싱**: Fly.io의 Edge 캐싱 활용
3. **데이터베이스**: 연결 풀링 설정 고려
4. **모니터링**: Fly.io 대시보드에서 성능 모니터링

## 보안 고려사항

1. 모든 환경변수는 `fly secrets`로 관리
2. HTTPS 강제 설정 (fly.toml에서 설정됨)
3. 정기적인 의존성 업데이트
4. 데이터베이스 접근 권한 최소화
