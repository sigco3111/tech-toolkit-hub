# Tech Toolkit Hub 개발 가이드라인

## 프로젝트 개요

### 기술 스택
- **Frontend**: React 19.1.0 + TypeScript 5.7.2
- **빌드 도구**: Vite 6.2.0
- **스타일링**: Tailwind CSS (CDN 방식)
- **차트**: Recharts 3.0.2
- **AI**: Google GenAI 1.7.0
- **모듈 시스템**: ES Modules with importmap (제로 빌드)

### 핵심 기능
- AI 및 개발 도구들의 카테고리별 분류 및 필터링
- 검색, 정렬, 데이터 시각화 기능
- Google Gemini API 기반 AI 도구 추천
- 향후 Firebase 기반 사용자 기여 플랫폼으로 확장 예정

## 파일 구조 및 역할

### 핵심 데이터 파일
- **constants.ts**: 모든 도구 데이터(AI_TOOLS_DATA)와 카테고리 목록 관리
- **types.ts**: TypeScript 인터페이스 정의 (AiTool, SortOption)
- **metadata.json**: 앱 메타데이터 (수정 금지)

### 컴포넌트 파일
- **App.tsx**: 메인 애플리케이션 로직 및 상태 관리
- **components/ToolCard.tsx**: 개별 도구 카드 렌더링
- **components/FilterControls.tsx**: 검색, 필터, 정렬 컨트롤
- **components/CategoryChart.tsx**: 카테고리별 평점 시각화
- **components/StarRating.tsx**: 별점 표시 컴포넌트
- **components/RecommendationModal.tsx**: AI 추천 모달

### 설정 파일
- **index.html**: importmap 설정 및 Tailwind CDN 로드
- **index.tsx**: React 애플리케이션 마운트
- **vite.config.ts**: Vite 설정
- **tsconfig.json**: TypeScript 설정

## 데이터 관리 규칙

### AiTool 인터페이스 수정 시
- **constants.ts와 types.ts를 동시에 수정**해야 함
- 새로운 필드 추가 시 기존 데이터 호환성 확인
- **rating은 0-5 범위의 number 타입 유지**
- **plan은 '기업플랜' | '무료' | null 타입 엄격 준수**

### 도구 데이터 추가/수정 시
- **AI_TOOLS_DATA 배열에서만 데이터 관리**
- 새 카테고리 추가 시 CATEGORIES 배열 자동 업데이트됨
- **URL은 반드시 https://로 시작**
- **description과 memo는 간결하게 작성** (각각 100자, 50자 이내 권장)

### 카테고리 관리
- **CATEGORIES는 AI_TOOLS_DATA에서 자동 생성되므로 직접 수정 금지**
- 새 카테고리는 도구 데이터에 추가하여 자동 반영

## 컴포넌트 개발 규칙

### React 19 기능 활용
- **함수형 컴포넌트와 Hooks 사용**
- **useMemo를 활용한 성능 최적화** (App.tsx의 filteredAndSortedTools 참고)
- **적절한 key prop 설정** (map 렌더링 시)

### Props 인터페이스 정의
- **모든 컴포넌트에 Props 인터페이스 명시적 정의**
- **React.FC<PropsType> 타입 명시**
- **선택적 props는 ? 연산자 사용**

### 상태 관리 패턴
- **useState로 로컬 상태 관리**
- **상태 변경 함수는 컴포넌트 props로 전달**
- **복잡한 상태 로직은 useMemo로 최적화**

### 이벤트 핸들링
- **화살표 함수 사용**
- **인라인 함수 대신 useCallback 고려** (성능상 이슈가 있을 때)

## 스타일링 규칙

### Tailwind CSS 사용법
- **CDN 방식 사용** (index.html에서 로드)
- **유틸리티 클래스 우선 사용**
- **커스텀 CSS는 최소한으로 제한**

### 색상 시스템
- **Primary**: sky 계열 (sky-500, sky-600, sky-100, sky-800)
- **Secondary**: slate 계열 (slate-900, slate-600, slate-500, slate-200)
- **Success**: green 계열 (green-100, green-800)
- **Warning**: purple 계열 (purple-100, purple-800)

### 반응형 디자인
- **모바일 우선 설계** (기본 스타일 → sm: → md: → lg: → xl:)
- **그리드 레이아웃**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- **간격**: gap-6 또는 gap-4 사용

### 카드 컴포넌트 스타일링
- **배경**: bg-white
- **그림자**: shadow-md, hover:shadow-lg
- **모서리**: rounded-xl
- **호버 효과**: hover:-translate-y-1 transition-transform

## Firebase 확장 준비사항

### 향후 통합 계획 (PRD 기반)
- **Firebase Firestore**: 도구 데이터, 댓글, 평점 저장
- **Firebase Authentication**: Google 소셜 로그인
- **환경 변수**: API 키 외부 주입 구조 준비

### 코드 구조 대비책
- **데이터 페칭 로직을 별도 함수로 분리 준비**
- **로딩 상태 관리를 위한 useState 구조 준비**
- **에러 처리를 위한 try-catch 패턴 준비**

### 타입 확장 준비
- **AiTool 인터페이스에 id, createdAt, updatedAt 필드 추가 가능성 고려**
- **User, Comment, Rating 타입 추가 예정**

## AI 기능 구현 규칙

### Google Gemini API 사용
- **RecommendationModal에서만 API 호출**
- **환경 변수로 API 키 관리** (process.env.API_KEY)
- **에러 처리 및 로딩 상태 관리 필수**

### API 호출 패턴
- **async/await 패턴 사용**
- **try-catch 블록으로 에러 처리**
- **사용자 친화적 에러 메시지 제공**

## 성능 최적화 규칙

### React 최적화
- **useMemo로 계산 비용이 높은 연산 캐싱**
- **불필요한 리렌더링 방지**
- **key prop 올바른 설정**

### 데이터 처리 최적화
- **필터링과 정렬을 한 번의 연산으로 처리**
- **검색어는 toLowerCase()로 대소문자 무시**

## 코드 품질 규칙

### TypeScript 엄격 모드
- **모든 변수에 타입 명시 또는 추론**
- **any 타입 사용 금지**
- **null/undefined 체크 필수**

### 에러 처리
- **모든 async 함수에 try-catch 블록**
- **사용자에게 구체적이지 않은 일반적인 에러 메시지 제공**
- **콘솔에는 상세한 에러 정보 로그**

### 주석 및 문서화
- **함수 상단에 한국어 주석으로 목적 설명**
- **복잡한 로직에는 단계별 주석 추가**
- **인터페이스에는 필드별 설명 주석**

## 금지 사항

### **절대 금지**
- **metadata.json 파일 수정**
- **package.json의 의존성 버전 임의 변경**
- **importmap 구조 변경**
- **Tailwind CDN 방식을 번들링 방식으로 변경**

### **데이터 관리 금지사항**
- **CATEGORIES 배열 직접 수정**
- **AI_TOOLS_DATA 외부에서 도구 데이터 중복 정의**
- **rating 값 5 초과 또는 음수 설정**

### **컴포넌트 개발 금지사항**
- **클래스 컴포넌트 사용**
- **인라인 스타일 사용** (Tailwind 클래스 사용)
- **DOM 직접 조작** (useRef 남용)

### **성능 관련 금지사항**
- **불필요한 useEffect 사용**
- **렌더링 함수 내부에서 객체/배열 새로 생성**
- **map의 index를 key로 사용** (고유한 식별자 사용)

## AI 결정 가이드라인

### 우선순위 판단
1. **사용자 경험** > 개발 편의성
2. **타입 안전성** > 코드 간결성  
3. **성능** > 기능 완성도
4. **기존 패턴 일관성** > 새로운 패턴 도입

### 애매한 상황 처리
- **기존 컴포넌트 패턴 참고 후 결정**
- **constants.ts의 데이터 구조 기준으로 판단**
- **Tailwind 클래스 조합 우선 시도**
- **PRD.md의 향후 계획 고려하여 확장 가능한 구조 선택**

### 에러 상황 대응
- **TypeScript 오류 즉시 수정**
- **런타임 에러는 try-catch로 처리**
- **빌드 오류 발생 시 의존성 및 import 구문 점검**
- **스타일링 이슈는 Tailwind 클래스 조합 재검토** 