// Firebase 도구 목록 관리 훅
import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  addDoc, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseTool, ToolInput, FirestoreQueryResult, SortOption } from '../../types';

/**
 * Firebase에서 도구 목록을 실시간으로 가져오고 관리하는 훅
 * @param category 필터링할 카테고리 (선택사항)
 * @param sortOrder 정렬 옵션
 * @returns 도구 목록, 로딩 상태, 에러, 도구 추가 함수
 */
export function useTools(category?: string, sortOrder: SortOption = 'created_desc'): FirestoreQueryResult<FirebaseTool> & {
  addTool: (toolData: ToolInput, userId: string) => Promise<void>;
  updateTool: (toolId: string, toolData: ToolInput, userId: string) => Promise<void>;
  deleteTool: (toolId: string, userId: string) => Promise<void>;
  categories: string[];
} {
  const [data, setData] = useState<FirebaseTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 useTools: Firebase 데이터 조회 시작');

      // Firestore 쿼리 구성
      const constraints: QueryConstraint[] = [];
      
      // 카테고리 필터링
      if (category && category !== '전체') {
        constraints.push(where('category', '==', category));
      }

      // 정렬 옵션 적용
      switch (sortOrder) {
        case 'rating_desc':
          constraints.push(orderBy('averageRating', 'desc'));
          break;
        case 'rating_asc':
          constraints.push(orderBy('averageRating', 'asc'));
          break;
        case 'name_asc':
          constraints.push(orderBy('name', 'asc'));
          break;
        case 'name_desc':
          constraints.push(orderBy('name', 'desc'));
          break;
        case 'created_desc':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'created_asc':
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case 'updated_desc':
          constraints.push(orderBy('updatedAt', 'desc'));
          break;
        case 'updated_asc':
          constraints.push(orderBy('updatedAt', 'asc'));
          break;
        default:
          constraints.push(orderBy('createdAt', 'desc'));
      }

      const toolsQuery = query(collection(db, 'tools'), ...constraints);

      // 실시간 데이터 구독
      const unsubscribe = onSnapshot(
        toolsQuery,
        (snapshot) => {
          console.log('📊 useTools: Firebase 응답 받음, 문서 수:', snapshot.size);
          const tools: FirebaseTool[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            tools.push({
              id: doc.id,
              name: data.name,
              category: data.category,
              url: data.url,
              description: data.description,
              memo: data.memo,
              plan: data.plan,
              averageRating: data.averageRating || 0,
              ratingCount: data.ratingCount || 0,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              createdBy: data.createdBy
            });
          });
          
          setData(tools);
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 도구 목록 조회 실패:', error);
          setError('도구 목록을 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 도구 목록 쿼리 설정 실패:', error);
      setError(error.message || '도구 목록 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [category, sortOrder]);

  /**
   * 새로운 도구를 Firestore에 추가
   * @param toolData 추가할 도구 정보
   * @param userId 도구를 추가하는 사용자 ID
   */
  const addTool = async (toolData: ToolInput, userId: string): Promise<void> => {
    try {
      const newTool = {
        ...toolData,
        averageRating: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId
      };

      await addDoc(collection(db, 'tools'), newTool);
      console.log('✅ 새 도구 추가 완료:', toolData.name);
      
    } catch (error: any) {
      console.error('❌ 도구 추가 실패:', error);
      throw new Error(error.message || '도구 추가 중 오류가 발생했습니다.');
    }
  };

  /**
   * 기존 도구를 Firestore에서 수정
   * @param toolId 수정할 도구 ID
   * @param toolData 수정할 도구 정보
   * @param userId 도구를 수정하는 사용자 ID
   */
  const updateTool = async (toolId: string, toolData: ToolInput, userId: string): Promise<void> => {
    try {
      // 도구 문서 참조
      const toolRef = doc(db, 'tools', toolId);
      
      // 수정할 데이터 준비 (평점 관련 필드는 제외)
      const updatedTool = {
        ...toolData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(toolRef, updatedTool);
      console.log('✅ 도구 수정 완료:', toolData.name);
      
    } catch (error: any) {
      console.error('❌ 도구 수정 실패:', error);
      throw new Error(error.message || '도구 수정 중 오류가 발생했습니다.');
    }
  };

  /**
   * 기존 도구를 Firestore에서 삭제
   * @param toolId 삭제할 도구 ID
   * @param userId 도구를 삭제하는 사용자 ID
   */
  const deleteTool = async (toolId: string, userId: string): Promise<void> => {
    try {
      // 도구 문서 참조
      const toolRef = doc(db, 'tools', toolId);
      
      await deleteDoc(toolRef);
      console.log('✅ 도구 삭제 완료:', toolId);
      
    } catch (error: any) {
      console.error('❌ 도구 삭제 실패:', error);
      throw new Error(error.message || '도구 삭제 중 오류가 발생했습니다.');
    }
  };

  // 사용 가능한 카테고리 목록 추출
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(data.map(tool => tool.category))];
    return ['전체', ...uniqueCategories.sort()];
  }, [data]);

  return {
    data,
    isLoading,
    error,
    addTool,
    updateTool,
    deleteTool,
    categories
  };
}

/**
 * 특정 도구의 상세 정보를 가져오는 훅
 * @param toolId 도구 ID
 * @returns 도구 정보, 로딩 상태, 에러
 */
export function useTool(toolId: string): {
  data: FirebaseTool | null;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<FirebaseTool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toolId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    try {
      // 특정 도구 문서 실시간 구독
      const toolQuery = query(
        collection(db, 'tools'),
        where('__name__', '==', toolId)
      );

      const unsubscribe = onSnapshot(
        toolQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const docData = doc.data();
            
            setData({
              id: doc.id,
              name: docData.name,
              category: docData.category,
              url: docData.url,
              description: docData.description,
              memo: docData.memo,
              plan: docData.plan,
              averageRating: docData.averageRating || 0,
              ratingCount: docData.ratingCount || 0,
              createdAt: docData.createdAt?.toDate() || new Date(),
              updatedAt: docData.updatedAt?.toDate() || new Date(),
              createdBy: docData.createdBy
            });
          } else {
            setData(null);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('❌ 도구 상세 조회 실패:', error);
          setError('도구 정보를 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
      
    } catch (error: any) {
      console.error('❌ 도구 상세 쿼리 설정 실패:', error);
      setError(error.message || '도구 정보 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [toolId]);

  return { data, isLoading, error };
} 