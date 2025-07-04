# AI 테크 허브

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue?logo=tailwindcss)](https://tailwindcss.com/) [![Firebase](https://img.shields.io/badge/Firebase-11.x-orange?logo=firebase)](https://firebase.google.com/)

**AI 테크 허브**는 개발자와 AI 사용자를 위한 필수 도구 모음 사이트입니다. AI 챗봇, 개발 도구, 클라우드 플랫폼 등 다양한 기술 스택의 도구들을 한곳에서 탐색, 필터링, 검색하고 AI 추천까지 받을 수 있는 모던 웹 애플리케이션입니다.

실행 주소 : https://dev-canvas-pi.vercel.app/

## ✨ 주요 기능

- **도구 목록 및 필터링**: 전체 도구 목록을 카테고리별로 필터링하여 볼 수 있습니다.
- **강력한 검색**: 도구 이름으로 원하는 것을 빠르게 검색할 수 있습니다.
- **정렬 기능**: 별점순(높은/낮은), 이름순(오름/내림)으로 목록을 정렬할 수 있습니다.
- **카테고리별 평점 시각화**: [Recharts](https://recharts.org/) 라이브러리를 이용한 막대 차트로 카테고리별 평균 별점을 한눈에 파악할 수 있습니다.
- **🤖 AI 기반 도구 추천**: Google Gemini API를 활용하여 "무엇을 하고 싶으신가요?"라는 사용자의 자연어 질문에 맞는 최적의 도구를 추천해 줍니다.
- **🔐 사용자 인증**: Firebase Authentication을 통한 Google 소셜 로그인
- **💾 실시간 데이터**: Firebase Firestore를 통한 실시간 데이터 동기화
- **⭐ 사용자 평점**: 도구별 사용자 평점 시스템 (0.5 단위)
- **💬 댓글 시스템**: 도구별 댓글 및 답글 기능
- **📤 데이터 내보내기/가져오기**: 관리자는 도구 데이터를 JSON 형식으로 내보내거나 가져올 수 있습니다.
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 등 모든 기기에서 최적화된 UI/UX를 제공합니다.
- **제로 빌드**: `importmap`을 사용하여 별도의 빌드 과정 없이 브라우저에서 직접 최신 JavaScript/TypeScript 모듈을 실행합니다.

## 🛠️ 기술 스택

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **AI**: [Google Gemini API (@google/genai)](https://ai.google.dev/sdks)
- **Module System**: [ES Modules with importmap](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) (No bundler required)

## 🚀 시작하기

이 프로젝트는 별도의 빌드 과정이 필요 없어 간편하게 실행할 수 있습니다.

### 사전 준비물

- 최신 웹 브라우저 (Chrome, Firefox, Edge 등)
- 코드 에디터 (예: VS Code)
- 로컬 웹 서버 (예: [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code 확장 프로그램 또는 `npx serve`)
- Firebase 프로젝트 (아래 설정 가이드 참조)

### Firebase 프로젝트 설정

1. **Firebase Console에서 프로젝트 생성**:
   - [Firebase Console](https://console.firebase.google.com/)에 접속
   - "프로젝트 추가" 클릭
   - 프로젝트 이름: "tech-toolkit-hub" (또는 원하는 이름)
   - Google Analytics 설정 (선택사항)

2. **Firestore Database 설정**:
   - Firebase Console → "Firestore Database" → "데이터베이스 만들기"
   - 테스트 모드로 시작 (나중에 보안 규칙 적용)
   - 위치 선택 (asia-northeast3 - 서울 권장)

3. **Authentication 설정**:
   - Firebase Console → "Authentication" → "시작하기"
   - "Sign-in method" 탭 → "Google" 활성화
   - 지원 이메일 주소 설정

4. **웹 앱 설정**:
   - Firebase Console → 프로젝트 설정 → "내 앱" → 웹 앱 추가
   - 앱 닉네임: "tech-toolkit-hub-web"
   - Firebase SDK 설정 코드 복사

### API 키 및 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 Firebase 설정을 추가하세요:

```bash
# Firebase 설정 (Firebase Console에서 복사)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id

# 관리자 계정 설정
VITE_ADMIN_ID=your_admin_id
VITE_ADMIN_PW=your_admin_password
```

**참고**: `.env` 파일은 `.gitignore`에 포함되어 있으므로 Git에 커밋되지 않습니다. 보안을 위해 API 키를 공개하지 마세요.

### 의존성 설치

```bash
npm install
```

### 실행 방법

1. **개발 서버 실행**:
   ```bash
   npm run dev
   ```

2. **브라우저에서 확인**:
   웹 서버가 제공하는 주소(예: `http://localhost:5173`)를 웹 브라우저에서 열어 애플리케이션을 확인합니다.

## 👨‍💼 어드민 사이트

AI 테크 허브는 관리자를 위한 별도의 어드민 페이지를 제공합니다. 이 페이지에서는 도구 및 카테고리를 관리할 수 있습니다.

### 어드민 접속 방법

- **URL**: `/admin` 또는 `/admin/login` 경로로 접속
- **인증**: 환경 변수로 설정된 관리자 계정으로 로그인
  - `.env` 파일에 설정된 `VITE_ADMIN_ID`와 `VITE_ADMIN_PW` 값을 사용
  - 보안을 위해 이 값들은 공개 저장소에 커밋하지 마세요

### 주요 기능

1. **도구 관리**:
   - 도구 목록 조회
   - 도구 추가/수정/삭제
   - 도구 데이터 일괄 내보내기/가져오기 (JSON 형식)

2. **카테고리 관리**:
   - 카테고리 목록 조회
   - 카테고리 추가/수정/삭제
   - 카테고리별 도구 수 확인

### Vercel 배포 시 주의사항

Vercel에 배포할 경우 SPA(Single Page Application) 라우팅 문제로 어드민 페이지에 직접 접근 시 404 에러가 발생할 수 있습니다. 이를 해결하기 위해 프로젝트 루트에 `vercel.json` 파일을 추가하여 모든 경로를 `index.html`로 리다이렉트하는 설정이 필요합니다:

```json
{
  "rewrites": [
    { "source": "/admin/:path*", "destination": "/index.html" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/",
      "status": 200
    }
  ]
}
```

또한 `public/404.html` 파일과 `index.html`에 리다이렉트 처리 스크립트를 추가하여 클라이언트 사이드 라우팅이 올바르게 작동하도록 해야 합니다.

## 📤 데이터 내보내기/가져오기

관리자 페이지에서는 도구 데이터를 JSON 형식으로 내보내거나 가져올 수 있습니다.

### 내보내기 기능

- 관리자 페이지의 도구 관리 화면에서 "JSON 내보내기" 버튼을 클릭하면 현재 등록된 모든 도구 데이터를 JSON 파일로 다운로드할 수 있습니다.
- 파일명은 `tech-toolkit-YYYY-MM-DD.json` 형식으로 저장됩니다.

### 가져오기 기능

- 관리자 페이지의 도구 관리 화면에서 "JSON 가져오기" 버튼을 클릭하여 JSON 파일을 선택합니다.
- 가져오기 모드를 선택할 수 있습니다:
  - **추가 모드**: 기존 데이터를 유지하면서 새 데이터를 추가합니다.
  - **교체 모드**: 기존 데이터를 모두 삭제하고 새 데이터로 교체합니다.
- 가져오기 전에 데이터 유효성을 검사하여 올바른 형식의 데이터만 가져옵니다.

## 📁 프로젝트 구조

```
.
├── src/
│   ├── components/             # 리액트 컴포넌트 디렉토리
│   │   ├── admin/              # 관리자 관련 컴포넌트
│   │   │   ├── AdminLayout.tsx # 관리자 레이아웃
│   │   │   ├── AdminLogin.tsx  # 관리자 로그인
│   │   │   ├── CategoryManager.tsx # 카테고리 관리
│   │   │   └── ToolManager.tsx # 도구 관리
│   │   ├── LoadingSkeleton.tsx # 로딩 상태 컴포넌트
│   │   ├── RatingSystem.tsx    # 평점 시스템
│   │   └── Toast.tsx           # 토스트 메시지
│   ├── contexts/               # 컨텍스트 API
│   │   ├── AdminContext.tsx    # 관리자 상태 관리
│   │   └── AuthContext.tsx     # 인증 상태 관리
│   ├── hooks/                  # React 커스텀 훅
│   │   ├── useAdminAuth.ts     # 관리자 인증 훅
│   │   ├── useAuth.ts          # 사용자 인증 훅
│   │   ├── useBookmarks.ts     # 북마크 관리 훅
│   │   ├── useComments.ts      # 댓글 관리 훅
│   │   ├── useRatings.ts       # 평점 관리 훅
│   │   ├── useToast.ts         # 토스트 메시지 훅
│   │   └── useTools.ts         # 도구 데이터 관리 훅
│   ├── lib/                    # 라이브러리 및 유틸리티
│   │   └── firebase.ts         # Firebase 초기화 및 설정
│   └── utils/                  # 유틸리티 함수
│       ├── exportImport.ts     # 데이터 내보내기/가져오기 유틸리티
│       └── performance.ts      # 성능 최적화 유틸리티
├── components/                 # 루트 레벨 컴포넌트
│   ├── AddToolModal.tsx        # 도구 추가 모달
│   ├── EditToolModal.tsx       # 도구 편집 모달
│   ├── FilterControls.tsx      # 필터링 컨트롤
│   ├── Pagination.tsx          # 페이지네이션
│   ├── RecommendationModal.tsx # AI 추천 모달
│   ├── ReviewModal.tsx         # 리뷰 모달
│   ├── SiteStatistics.tsx      # 사이트 통계
│   ├── StarRating.tsx          # 별점 컴포넌트
│   ├── ToolCard.tsx            # 도구 카드
│   └── UserAuth.tsx            # 사용자 인증 컴포넌트
├── scripts/                    # 스크립트
│   ├── init-collections.ts     # 컬렉션 초기화 스크립트
│   └── migrate-data.ts         # 데이터 마이그레이션 스크립트
├── public/                     # 정적 파일 디렉토리
│   └── 404.html                # SPA 라우팅을 위한 404 리다이렉트 페이지
├── types.ts                    # TypeScript 타입 정의
├── App.tsx                     # 메인 애플리케이션 컴포넌트
├── index.html                  # HTML 진입점 및 importmap 설정
├── index.tsx                   # React 애플리케이션 마운트 스크립트
├── vercel.json                 # Vercel 배포 설정
├── metadata.json               # 앱 메타데이터
└── README.md                   # 프로젝트 설명 파일
```

## 🔒 보안 고려사항

- Firebase 보안 규칙을 설정하여 인증된 사용자만 데이터를 수정할 수 있도록 합니다.
- API 키는 환경 변수로 관리하며 공개 저장소에 업로드하지 않습니다.
- 사용자 입력값에 대한 검증 및 서버 측 유효성 검사를 구현합니다.
- 관리자 기능(데이터 내보내기/가져오기)은 관리자 권한이 있는 사용자만 접근할 수 있습니다.

---
