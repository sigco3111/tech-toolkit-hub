export interface AiTool {
  category: string;
  name: string;
  url: string;
  description: string;
  memo: string;
  rating: number;
  plan: string | null;
}

export type SortOption = 'rating_desc' | 'rating_asc' | 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc';

// Firebase 관련 타입 정의

// Firebase Tool 인터페이스 - 기존 AiTool과 호환되면서 Firebase 기능 확장
export interface FirebaseTool extends Omit<AiTool, 'rating'> {
  id: string;
  averageRating: number; // 평균 평점으로 변경
  ratingCount: number; // 평점 개수
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // 사용자 UID
}

// Firebase 사용자 인터페이스
export interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: Date;
}

// 사용자 평점 인터페이스
export interface FirebaseRating {
  id: string;
  toolId: string;
  userId: string;
  rating: number; // 0.5 단위 (0.5 ~ 5.0)
  createdAt: Date;
  updatedAt: Date;
}

// 댓글 인터페이스 (1단계 답글 지원)
export interface FirebaseComment {
  id: string;
  toolId: string;
  userId: string;
  userName: string; // 표시용 사용자 이름
  userPhotoURL: string | null; // 사용자 프로필 이미지
  content: string;
  parentId: string | null; // null이면 부모 댓글, 값이 있으면 답글
  createdAt: Date;
  updatedAt: Date;
}

// Firestore 쿼리 결과 타입
export interface FirestoreQueryResult<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
}

// 도구 추가/수정용 입력 타입
export interface ToolInput {
  name: string;
  category: string;
  url: string;
  description: string;
  memo: string;
  plan: string | null;
}

// 댓글 추가용 입력 타입
export interface CommentInput {
  toolId: string;
  content: string;
  parentId?: string | null; // 답글인 경우 부모 댓글 ID
}
