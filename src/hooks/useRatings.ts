// Firebase 평점 관리 훅
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
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseRating, FirestoreQueryResult } from '../../types';

/**
 * 특정 도구의 평점 목록을 실시간으로 가져오는 훅
 * @param toolId 도구 ID
 * @returns 평점 목록, 평점 통계, 평점 관리 함수들
 */
export function useRatings(toolId: string): FirestoreQueryResult<FirebaseRating> & {
  averageRating: number;
  ratingCount: number;
  addRating: (userId: string, rating: number) => Promise<void>;
  updateRating: (ratingId: string, rating: number) => Promise<void>;
  deleteRating: (ratingId: string) => Promise<void>;
  getUserRating: (userId: string) => FirebaseRating | null;
} {
  const [data, setData] = useState<FirebaseRating[]>([]);
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

      // 특정 도구의 모든 평점 실시간 구독 (인덱스 없이 작동하도록 단순화)
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('toolId', '==', toolId)
      );

      const unsubscribe = onSnapshot(
        ratingsQuery,
        (snapshot) => {
          const ratings: FirebaseRating[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            ratings.push({
              id: doc.id,
              toolId: data.toolId,
              userId: data.userId,
              rating: data.rating,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            });
          });
          
          // 클라이언트에서 최신순으로 정렬
          ratings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          
          setData(ratings);
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 평점 목록 조회 실패:', error);
          console.error('❌ 오류 상세:', error.code, error.message);
          setError(`평점을 불러오는 중 오류가 발생했습니다: ${error.message}`);
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 평점 쿼리 설정 실패:', error);
      setError(error.message || '평점 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [toolId]);

  /**
   * 새로운 평점을 추가
   * @param userId 사용자 ID
   * @param rating 평점 (0.5 ~ 5.0)
   */
  const addRating = async (userId: string, rating: number): Promise<void> => {
    try {
      // 평점 유효성 검사
      if (rating < 0.5 || rating > 5.0) {
        throw new Error('평점은 0.5점에서 5.0점 사이여야 합니다.');
      }

      // 이미 평점을 남긴 사용자인지 확인
      const existingRating = data.find(r => r.userId === userId);
      if (existingRating) {
        throw new Error('이미 평점을 남기셨습니다. 수정을 원하시면 평점 수정을 이용해주세요.');
      }

      const newRating = {
        toolId,
        userId,
        rating,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'ratings'), newRating);
      
      // 도구의 평균 평점 업데이트
      await updateToolAverageRating(toolId);
      
      console.log('✅ 평점 추가 완료');
      
    } catch (error: any) {
      console.error('❌ 평점 추가 실패:', error);
      throw new Error(error.message || '평점 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 평점을 수정
   * @param ratingId 평점 ID
   * @param rating 새로운 평점 (0.5 ~ 5.0)
   */
  const updateRating = async (ratingId: string, rating: number): Promise<void> => {
    try {
      // 평점 유효성 검사
      if (rating < 0.5 || rating > 5.0) {
        throw new Error('평점은 0.5점에서 5.0점 사이여야 합니다.');
      }

      const ratingDoc = doc(db, 'ratings', ratingId);
      await updateDoc(ratingDoc, {
        rating,
        updatedAt: serverTimestamp()
      });
      
      // 도구의 평균 평점 업데이트
      await updateToolAverageRating(toolId);
      
      console.log('✅ 평점 수정 완료');
      
    } catch (error: any) {
      console.error('❌ 평점 수정 실패:', error);
      throw new Error(error.message || '평점 수정 중 오류가 발생했습니다.');
    }
  };

  /**
   * 평점을 삭제
   * @param ratingId 평점 ID
   */
  const deleteRating = async (ratingId: string): Promise<void> => {
    try {
      const ratingDoc = doc(db, 'ratings', ratingId);
      await deleteDoc(ratingDoc);
      
      // 도구의 평균 평점 업데이트
      await updateToolAverageRating(toolId);
      
      console.log('✅ 평점 삭제 완료');
      
    } catch (error: any) {
      console.error('❌ 평점 삭제 실패:', error);
      throw new Error(error.message || '평점 삭제 중 오류가 발생했습니다.');
    }
  };

  /**
   * 도구의 평균 평점과 평점 수를 업데이트
   * @param toolId 도구 ID
   */
  const updateToolAverageRating = async (toolId: string): Promise<void> => {
    try {
      // 현재 평점들을 다시 조회하여 평균 계산
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('toolId', '==', toolId)
      );

      // getDocs를 사용하여 한 번만 데이터 가져오기
      const snapshot = await getDocs(ratingsQuery);

      const ratings = snapshot.docs.map((doc) => doc.data().rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;
      const ratingCount = ratings.length;

      // 도구 문서 업데이트
      const toolDoc = doc(db, 'tools', toolId);
      await updateDoc(toolDoc, {
        averageRating: Math.round(averageRating * 10) / 10, // 소수점 첫째자리까지
        ratingCount,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ 도구 평균 평점 업데이트: ${averageRating.toFixed(1)}점 (${ratingCount}개)`);
      
    } catch (error: any) {
      console.error('❌ 도구 평균 평점 업데이트 실패:', error);
      // 평점 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  };

  // 평균 평점 계산
  const averageRating = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / data.length) * 10) / 10; // 소수점 첫째자리까지
  }, [data]);

  // 평점 수
  const ratingCount = data.length;

  /**
   * 특정 사용자의 평점을 가져오기
   * @param userId 사용자 ID
   * @returns 사용자의 평점 또는 null
   */
  const getUserRating = (userId: string): FirebaseRating | null => {
    return data.find(rating => rating.userId === userId) || null;
  };

  return {
    data,
    isLoading,
    error,
    averageRating,
    ratingCount,
    addRating,
    updateRating,
    deleteRating,
    getUserRating
  };
}

/**
 * 사용자의 모든 평점을 가져오는 훅
 * @param userId 사용자 ID
 * @returns 사용자 평점 목록, 로딩 상태, 에러
 */
export function useUserRatings(userId: string): FirestoreQueryResult<FirebaseRating> {
  const [data, setData] = useState<FirebaseRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // 사용자의 모든 평점 실시간 구독
      const userRatingsQuery = query(
        collection(db, 'ratings'),
        where('userId', '==', userId)
      );

      const unsubscribe = onSnapshot(
        userRatingsQuery,
        (snapshot) => {
          const ratings: FirebaseRating[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            ratings.push({
              id: doc.id,
              toolId: data.toolId,
              userId: data.userId,
              rating: data.rating,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date()
            });
          });
          
          setData(ratings);
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 사용자 평점 조회 실패:', error);
          setError('사용자 평점을 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 사용자 평점 쿼리 설정 실패:', error);
      setError(error.message || '사용자 평점 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [userId]);

  return { data, isLoading, error };
} 