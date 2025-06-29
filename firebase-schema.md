# Firebase Firestore 데이터베이스 스키마

AI 테크 허브의 Firebase Firestore 데이터베이스 구조를 정의합니다.

## 컬렉션 구조

### 1. `tools` 컬렉션
도구 정보를 저장하는 메인 컬렉션

```typescript
interface ToolDocument {
  id: string;                    // 도구 고유 ID (자동 생성)
  name: string;                  // 도구 이름
  category: string;              // 카테고리 (예: "AI 챗봇", "개발 도구")
  url: string;                   // 도구 웹사이트 URL
  description: string;           // 도구 설명
  memo: string;                  // 추가 메모
  plan: "무료" | null;           // 요금제 정보
  averageRating: number;         // 평균 평점 (0.0 ~ 5.0)
  ratingCount: number;           // 평점 개수
  createdAt: Timestamp;          // 생성 일시
  updatedAt: Timestamp;          // 수정 일시
  createdBy: string;             // 생성자 UID
}
```

**인덱스**:
- `category` + `averageRating` (내림차순) - 카테고리별 평점순 정렬
- `category` + `name` (오름차순) - 카테고리별 이름순 정렬

### 2. `users` 컬렉션
사용자 정보를 저장하는 컬렉션

```typescript
interface UserDocument {
  uid: string;                   // Firebase Auth UID (문서 ID와 동일)
  displayName: string | null;    // 사용자 표시 이름
  email: string | null;          // 이메일 주소
  photoURL: string | null;       // 프로필 이미지 URL
  createdAt: Timestamp;          // 가입 일시
}
```

### 3. `ratings` 컬렉션
도구별 사용자 평점을 저장하는 컬렉션

```typescript
interface RatingDocument {
  id: string;                    // 평점 고유 ID (자동 생성)
  toolId: string;                // 평점이 달린 도구 ID
  userId: string;                // 평점을 남긴 사용자 UID
  rating: number;                // 평점 (0.5 ~ 5.0, 0.5 단위)
  createdAt: Timestamp;          // 생성 일시
  updatedAt: Timestamp;          // 수정 일시
}
```

**인덱스**:
- `toolId` + `userId` - 중복 평점 방지 및 사용자별 평점 조회
- `toolId` + `createdAt` (내림차순) - 도구별 최신 평점 조회

### 4. `comments` 컬렉션
도구별 댓글 및 답글을 저장하는 컬렉션

```typescript
interface CommentDocument {
  id: string;                    // 댓글 고유 ID (자동 생성)
  toolId: string;                // 댓글이 달린 도구 ID
  userId: string;                // 댓글 작성자 UID
  userName: string;              // 댓글 작성자 표시 이름
  userPhotoURL: string | null;   // 댓글 작성자 프로필 이미지
  content: string;               // 댓글 내용 (최대 1000자)
  parentId: string | null;       // 부모 댓글 ID (null이면 최상위 댓글)
  createdAt: Timestamp;          // 생성 일시
  updatedAt: Timestamp;          // 수정 일시
}
```

**인덱스**:
- `toolId` + `createdAt` (내림차순) - 도구별 최신 댓글 조회
- `toolId` + `parentId` + `createdAt` (오름차순) - 답글 조회

## 보안 규칙 요약

### 읽기 권한
- 모든 컬렉션: 모든 사용자 읽기 가능

### 쓰기 권한
- **tools**: 인증된 사용자가 생성 가능, 작성자만 수정/삭제 가능
- **users**: 본인 정보만 생성/수정/삭제 가능
- **ratings**: 인증된 사용자가 생성 가능, 작성자만 수정/삭제 가능
- **comments**: 인증된 사용자가 생성 가능, 작성자만 수정/삭제 가능

### 유효성 검사
- **ratings**: 평점 범위 0.5 ~ 5.0 검증
- **comments**: 내용 길이 1 ~ 1000자 검증
- **모든 컬렉션**: 생성/수정 시간 자동 설정

## 쿼리 패턴

### 1. 도구 목록 조회
```typescript
// 전체 도구 목록 (평점순)
db.collection('tools').orderBy('averageRating', 'desc')

// 카테고리별 도구 목록
db.collection('tools')
  .where('category', '==', 'AI 챗봇')
  .orderBy('averageRating', 'desc')
```

### 2. 평점 조회
```typescript
// 특정 도구의 평점 목록
db.collection('ratings')
  .where('toolId', '==', toolId)
  .orderBy('createdAt', 'desc')

// 사용자의 특정 도구 평점 확인
db.collection('ratings')
  .where('toolId', '==', toolId)
  .where('userId', '==', userId)
```

### 3. 댓글 조회
```typescript
// 특정 도구의 최상위 댓글
db.collection('comments')
  .where('toolId', '==', toolId)
  .where('parentId', '==', null)
  .orderBy('createdAt', 'desc')

// 특정 댓글의 답글
db.collection('comments')
  .where('parentId', '==', commentId)
  .orderBy('createdAt', 'asc')
```

## 배포 방법

### 1. 보안 규칙 배포
```bash
firebase deploy --only firestore:rules
```

### 2. 인덱스 배포
```bash
firebase deploy --only firestore:indexes
```

### 3. 전체 배포
```bash
firebase deploy
``` 