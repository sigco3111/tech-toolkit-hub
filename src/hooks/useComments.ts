// Firebase 댓글 관리 훅
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseComment, CommentInput, FirestoreQueryResult } from '../../types';

/**
 * 도구의 업데이트 날짜를 갱신하는 유틸리티 함수
 * @param toolId 도구 ID
 */
const updateToolUpdatedAt = async (toolId: string): Promise<void> => {
  try {
    const toolDoc = doc(db, 'tools', toolId);
    await updateDoc(toolDoc, {
      updatedAt: serverTimestamp()
    });
    console.log('✅ 도구 업데이트 날짜 갱신 완료');
  } catch (error: any) {
    console.error('❌ 도구 업데이트 날짜 갱신 실패:', error);
    // 도구 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
};

/**
 * 특정 도구의 댓글 목록을 실시간으로 가져오는 훅
 * @param toolId 도구 ID
 * @returns 댓글 목록, 댓글 통계, 댓글 관리 함수들
 */
export function useComments(toolId: string): FirestoreQueryResult<FirebaseComment> & {
  parentComments: FirebaseComment[];
  getReplies: (parentId: string) => FirebaseComment[];
  addComment: (commentData: CommentInput, userId: string, userName: string, userPhotoURL?: string | null) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  commentCount: number;
} {
  const [data, setData] = useState<FirebaseComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 특정 도구의 모든 댓글 실시간 구독 (인덱스 없이 작동하도록 단순화)
      const commentsQuery = query(
        collection(db, 'comments'),
        where('toolId', '==', toolId)
      );

      const unsubscribe = onSnapshot(
        commentsQuery,
        (snapshot) => {
          const comments: FirebaseComment[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
              id: doc.id,
              toolId: data.toolId,
              userId: data.userId,
              userName: data.userName,
              userPhotoURL: data.userPhotoURL || null,
              content: data.content,
              parentId: data.parentId || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            });
          });
          
          // 클라이언트에서 생성 시간순으로 정렬
          comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          
          setData(comments);
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 댓글 목록 조회 실패:', error);
          console.error('❌ 오류 상세:', error.code, error.message);
          setError(`댓글을 불러오는 중 오류가 발생했습니다: ${error.message}`);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 댓글 쿼리 설정 실패:', error);
      setError(error.message || '댓글 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [toolId]);

  /**
   * 새로운 댓글 또는 답글을 추가
   * @param commentData 댓글 데이터
   * @param userId 사용자 ID
   * @param userName 사용자 이름
   * @param userPhotoURL 사용자 프로필 이미지 URL
   */
  const addComment = async (
    commentData: CommentInput, 
    userId: string, 
    userName: string, 
    userPhotoURL?: string | null
  ): Promise<void> => {
    try {
      // 댓글 내용 유효성 검사
      if (!commentData.content.trim()) {
        throw new Error('댓글 내용을 입력해주세요.');
      }

      if (commentData.content.length > 1000) {
        throw new Error('댓글은 1000자 이하로 작성해주세요.');
      }

      const newComment = {
        toolId: commentData.toolId,
        userId,
        userName,
        userPhotoURL: userPhotoURL || null,
        content: commentData.content.trim(),
        parentId: commentData.parentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'comments'), newComment);
      
      // 댓글이 추가된 도구의 업데이트 날짜도 갱신
      await updateToolUpdatedAt(commentData.toolId);
      
      console.log('✅ 댓글 추가 완료');
      
    } catch (error: any) {
      console.error('❌ 댓글 추가 실패:', error);
      throw new Error(error.message || '댓글 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 댓글 내용을 수정
   * @param commentId 댓글 ID
   * @param content 새로운 댓글 내용
   */
  const updateComment = async (commentId: string, content: string): Promise<void> => {
    try {
      // 댓글 내용 유효성 검사
      if (!content.trim()) {
        throw new Error('댓글 내용을 입력해주세요.');
      }

      if (content.length > 1000) {
        throw new Error('댓글은 1000자 이하로 작성해주세요.');
      }

      // 수정할 댓글 찾기 (도구 ID 확인용)
      const commentToUpdate = data.find(comment => comment.id === commentId);
      if (!commentToUpdate) {
        throw new Error('수정할 댓글을 찾을 수 없습니다.');
      }

      const commentDoc = doc(db, 'comments', commentId);
      await updateDoc(commentDoc, {
        content: content.trim(),
        updatedAt: serverTimestamp()
      });

      // 댓글이 수정된 도구의 업데이트 날짜도 갱신
      await updateToolUpdatedAt(commentToUpdate.toolId);

      console.log('✅ 댓글 수정 완료');
      
    } catch (error: any) {
      console.error('❌ 댓글 수정 실패:', error);
      throw new Error(error.message || '댓글 수정 중 오류가 발생했습니다.');
    }
  };

  /**
   * 댓글을 삭제 (답글이 있는 경우 답글도 함께 삭제)
   * @param commentId 댓글 ID
   */
  const deleteComment = async (commentId: string): Promise<void> => {
    try {
      // 삭제할 댓글 찾기 (도구 ID 확인용)
      const commentToDelete = data.find(comment => comment.id === commentId);
      if (!commentToDelete) {
        throw new Error('삭제할 댓글을 찾을 수 없습니다.');
      }

      // 해당 댓글의 답글들도 함께 삭제
      const replies = data.filter(comment => comment.parentId === commentId);
      
      // 답글들 먼저 삭제
      for (const reply of replies) {
        const replyDoc = doc(db, 'comments', reply.id);
        await deleteDoc(replyDoc);
      }

      // 원본 댓글 삭제
      const commentDoc = doc(db, 'comments', commentId);
      await deleteDoc(commentDoc);
      
      // 댓글이 삭제된 도구의 업데이트 날짜도 갱신
      await updateToolUpdatedAt(commentToDelete.toolId);
      
      console.log('✅ 댓글 삭제 완료 (답글 포함)');
      
    } catch (error: any) {
      console.error('❌ 댓글 삭제 실패:', error);
      throw new Error(error.message || '댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 최상위 댓글들 (parentId가 null인 댓글들)
  const parentComments = useMemo(() => {
    return data.filter(comment => comment.parentId === null);
  }, [data]);

  /**
   * 특정 댓글의 답글들을 가져오기
   * @param parentId 부모 댓글 ID
   * @returns 답글 목록
   */
  const getReplies = (parentId: string): FirebaseComment[] => {
    return data.filter(comment => comment.parentId === parentId);
  };

  const commentCount = data.length;

  return {
    data,
    isLoading,
    error,
    parentComments,
    getReplies,
    addComment,
    updateComment,
    deleteComment,
    commentCount
  };
}

/**
 * 최신 댓글 N개를 가져오는 훅 (ToolCard에서 사용)
 * @param toolId 도구 ID
 * @param limit 가져올 댓글 수 (기본값: 5)
 * @returns 최신 댓글 목록, 로딩 상태, 에러
 */
export function useRecentComments(toolId: string, limit: number = 5): FirestoreQueryResult<FirebaseComment> {
  const [data, setData] = useState<FirebaseComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 최신 댓글 N개 실시간 구독 (인덱스 없이 작동하도록 단순화)
      const recentCommentsQuery = query(
        collection(db, 'comments'),
        where('toolId', '==', toolId),
        where('parentId', '==', null) // 최상위 댓글만
      );

      const unsubscribe = onSnapshot(
        recentCommentsQuery,
        (snapshot) => {
          const comments: FirebaseComment[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            comments.push({
              id: doc.id,
              toolId: data.toolId,
              userId: data.userId,
              userName: data.userName,
              userPhotoURL: data.userPhotoURL || null,
              content: data.content,
              parentId: data.parentId || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            });
          });
          
          // 클라이언트에서 최신순으로 정렬하고 제한된 개수만 반환
          comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          const limitedComments = comments.slice(0, limit);
          
          setData(limitedComments);
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 최신 댓글 조회 실패:', error);
          console.error('❌ 오류 상세:', error.code, error.message);
          setError(`최신 댓글을 불러오는 중 오류가 발생했습니다: ${error.message}`);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 최신 댓글 쿼리 설정 실패:', error);
      setError(error.message || '최신 댓글 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [toolId, limit]);

  return { data, isLoading, error };
} 