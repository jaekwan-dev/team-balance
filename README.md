# PPUNGBROS - 풋살팀 매니저 앱 ⚽

풋살팀 운영을 위한 올인원 관리 플랫폼입니다. 경기 일정 관리, 팀원 출석 체크, 자동 팀 편성 등 풋살팀 운영에 필요한 모든 기능을 제공합니다.

## 🚀 주요 기능

### 👥 회원 관리
- **카카오 소셜 로그인**: 간편한 카카오 계정 연동 로그인
- **프로필 관리**: 실명, 연락처 정보 관리
- **레벨 시스템**: 프로 ~ 루키까지 13단계 레벨 체계
  - PRO, SEMI_PRO (1-3), AMATEUR (1-5), BEGINNER (1-3), ROOKIE

### 📅 경기 일정 관리
- **일정 등록/수정/삭제**: 관리자 전용 일정 관리
- **상세 정보**: 날짜, 시간, 장소, 최대 인원, 공지사항
- **실시간 현황**: 참석/불참/대기 상태 실시간 확인
- **댓글 시스템**: 경기별 의견 및 소통

### ✅ 출석 관리
- **원클릭 참석/불참**: 간편한 출석 체크
- **재투표 기능**: 의견 변경 가능
- **게스트 등록**: 외부 인원 초대 및 관리 (레벨 지정 가능)
- **실시간 집계**: 참석 인원 실시간 확인

### ⚡ 자동 팀 편성
- **AI 기반 밸런싱**: 레벨을 고려한 공정한 팀 구성
- **2팀/3팀 편성**: 인원에 따른 유연한 팀 구성
- **카카오톡 공유**: 원클릭 팀 편성 결과 공유
- **재편성 기능**: 필요시 팀 재구성

### 📊 대시보드
- **다음 경기 정보**: 한눈에 보는 다음 경기 상세 정보
- **참석 현황**: 실시간 참석/불참 인원 확인
- **팀 편성 결과**: 현재 팀 구성 확인
- **통계**: 총 경기 수, 나의 참석률 등

### 👨‍💼 관리자 기능
- **일정 관리**: 경기 일정 CRUD
- **팀원 관리**: 회원 정보 수정, 레벨 조정
- **게스트 관리**: 게스트 삭제 권한
- **팀 편성**: 자동 팀 편성 실행

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Form**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js (Auth.js v5)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase
- **OAuth**: Kakao Login API

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18.0 이상
- PostgreSQL 데이터베이스
- Kakao 개발자 앱 (OAuth 2.0)

### 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
AUTH_SECRET="your-auth-secret"
AUTH_URL="http://localhost:3000"

# Kakao OAuth
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 📱 주요 화면

### 홈 (대시보드)
- 다음 경기 정보 표시
- 참석/불참 버튼
- 실시간 참석 현황
- 팀 편성 결과
- 댓글 시스템

### 일정 관리 (관리자)
- 경기 일정 등록/수정/삭제
- 날짜/시간 선택 (달력 UI)
- 장소 및 공지사항 입력

### 팀원 목록
- 전체 팀원 리스트
- 레벨별 필터링
- 프로필 상세 보기

### 프로필
- 개인 정보 수정
- 참석 기록 확인
- 레벨 표시

## 🎨 UI/UX 특징

- **다크 테마**: 눈의 피로를 줄이는 다크 모드 기본 적용
- **반응형 디자인**: 모바일 우선 설계로 모든 디바이스 지원
- **실시간 업데이트**: 참석 현황 및 팀 편성 실시간 반영
- **직관적 인터페이스**: 원클릭 조작으로 간편한 사용
- **레이싱 스타일**: 빨간색 포인트 컬러의 스포티한 디자인

## 🔒 보안

- **인증**: NextAuth.js를 통한 안전한 세션 관리
- **권한 관리**: 관리자/일반 회원 권한 분리
- **데이터 보호**: Prisma ORM을 통한 SQL Injection 방지
- **HTTPS**: 프로덕션 환경 SSL 적용

## 📝 라이선스

This project is private and proprietary.

## 👥 팀

- **개발**: PPUNGBROS 개발팀
- **디자인**: PPUNGBROS 디자인팀
- **기획**: PPUNGBROS 기획팀

## 📞 문의

문의사항이 있으시면 팀 관리자에게 연락해주세요.

---

**PPUNGBROS** - 함께 달리는 즐거움 🏃‍♂️⚽