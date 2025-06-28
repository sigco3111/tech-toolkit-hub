# Tech Toolkit Hub

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-blue?logo=tailwindcss)](https://tailwindcss.com/) [![Firebase](https://img.shields.io/badge/Firebase-11.x-orange?logo=firebase)](https://firebase.google.com/) [![Gemini API](https://img.shields.io/badge/Google_Gemini-API-orange?logo=google-gemini)](https://ai.google.dev/)

**Tech Toolkit Hub**는 개발자와 AI 사용자를 위한 필수 도구 모음 사이트입니다. AI 챗봇, 개발 도구, 클라우드 플랫폼 등 다양한 기술 스택의 도구들을 한곳에서 탐색, 필터링, 검색하고 AI 추천까지 받을 수 있는 모던 웹 애플리케이션입니다.

![Tech Toolkit Hub Screenshot](https://storage.googleapis.com/static.protopie.io/challenges/resources/D1/challenge_1.gif)

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

## 🗂️ 도구 관리 스크립트

Firebase에 저장된 도구 데이터를 name으로 검색하여 조회, 수정, 삭제할 수 있는 관리 스크립트를 제공합니다.

### 사용법

#### 1. 대화형 모드 (권장)

인수 없이 실행하면 대화형 모드로 시작됩니다:

```bash
npm run manage-tool
```

대화형 모드에서는 다음과 같은 기능을 제공합니다:
- 도구 이름 검색 (정확한 매치 또는 부분 매치)
- 여러 도구가 검색될 경우 선택 메뉴 제공
- 도구 정보 조회
- 도구 정보 수정 (이름, 카테고리, URL, 설명, 메모, 플랜)
- 도구 삭제 (관련 평점/댓글 포함 또는 제외 선택 가능)

#### 2. 명령행 모드

특정 명령을 직접 실행할 수 있습니다:

```bash
# 도구 검색
npm run manage-tool search "도구이름"

# 도구 삭제 (도구만)
npm run manage-tool delete "도구이름"

# 도구 삭제 (관련 평점/댓글 포함)
npm run manage-tool delete-all "도구이름"
```

### 주요 기능

- **정확한 검색**: 입력한 이름과 정확히 일치하는 도구를 우선 검색
- **유사 검색**: 정확한 매치가 없을 경우 부분 매치 검색 수행
- **안전한 삭제**: 삭제 전 확인 메시지로 실수 방지
- **관련 데이터 관리**: 도구 삭제 시 평점과 댓글도 함께 삭제하는 옵션 제공
- **상세 정보**: 검색된 도구의 ID, 이름, 카테고리, URL, 설명, 작성자, 평점 등 표시

### 환경 변수 확인

스크립트 실행 전 Firebase 환경 변수가 설정되어 있는지 확인하세요:

```bash
# 필수 환경 변수
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_API_KEY=your_firebase_api_key  
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
```

### 사용 예시

1. **도구 검색 및 조회**:
   ```
   🔍 도구 검색 중: "ChatGPT"
   ✅ 1개의 도구를 찾았습니다 (정확한 매치):
   1. ID: abc123def456
      이름: ChatGPT
      카테고리: AI 챗봇
      URL: https://chat.openai.com
      설명: OpenAI에서 개발한 대화형 AI 모델...
      작성자: user123
      평점: 4.5 (25명)
   ```

2. **도구 정보 수정**:
   - 대화형 모드에서 도구 선택 후 "2. 도구 정보 수정" 선택
   - 수정하고 싶은 필드만 입력 (나머지는 엔터로 건너뛰기)
   - 확인 후 수정 실행

3. **도구 삭제**:
   - "3. 도구 삭제 (관련 데이터 포함)": 평점, 댓글까지 모두 삭제
   - "4. 도구 삭제 (도구만)": 도구만 삭제하고 평점/댓글은 유지

## 📁 프로젝트 구조

```
.
├── src/
│   ├── components/             # 리액트 컴포넌트 디렉토리
│   │   ├── CategoryChart.tsx   # 카테고리별 평점 차트
│   │   ├── FilterControls.tsx  # 필터링 및 정렬 컨트롤
│   │   ├── RecommendationModal.tsx # AI 추천 기능 모달
│   │   ├── StarRating.tsx      # 별점 표시 컴포넌트
│   │   └── ToolCard.tsx        # 개별 도구 정보 카드
│   ├── lib/
│   │   ├── firebase.ts         # Firebase 초기화 및 설정
│   │   └── gemini.ts          # Google Gemini API 호출 함수
│   └── hooks/                  # React 커스텀 훅
├── constants.ts                # 애플리케이션에서 사용하는 상수 데이터
├── types.ts                    # TypeScript 타입 정의
├── App.tsx                     # 메인 애플리케이션 컴포넌트
├── index.html                  # HTML 진입점 및 importmap 설정
├── index.tsx                   # React 애플리케이션 마운트 스크립트
├── metadata.json               # 앱 메타데이터
└── README.md                   # 프로젝트 설명 파일
```

## 🔒 보안 고려사항

- Firebase 보안 규칙을 설정하여 인증된 사용자만 데이터를 수정할 수 있도록 합니다.
- API 키는 환경 변수로 관리하며 공개 저장소에 업로드하지 않습니다.
- 사용자 입력값에 대한 검증 및 서버 측 유효성 검사를 구현합니다.

---
