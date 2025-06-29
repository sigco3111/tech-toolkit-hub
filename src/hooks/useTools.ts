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
  QueryConstraint,
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FirebaseTool, ToolInput, FirestoreQueryResult, SortOption } from '../../types';

/**
 * Firebase에서 도구 목록을 실시간으로 가져오고 관리하는 훅
 * @param category 필터링할 카테고리 (선택사항)
 * @param sortOrder 정렬 옵션
 * @returns 도구 목록, 로딩 상태, 에러, 도구 추가 함수
 */
export function useTools(category?: string, sortOrder: SortOption = 'updated_desc'): FirestoreQueryResult<FirebaseTool> & {
  addTool: (toolData: ToolInput, userId: string) => Promise<void>;
  updateTool: (toolId: string, toolData: ToolInput, userId: string) => Promise<void>;
  deleteTool: (toolId: string, userId: string) => Promise<void>;
  categories: string[];
} {
  const [data, setData] = useState<FirebaseTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTools, setAllTools] = useState<FirebaseTool[]>([]);

  // 모든 도구 데이터 로드 - 인덱스 문제를 피하기 위해 단순 쿼리 사용
  useEffect(() => {
    // 이전 구독 취소를 위한 변수
    let unsubscribe: (() => void) | undefined;
    
    // 데이터 로드 함수
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 useTools: Firebase 데이터 조회 시작');

        // 단순 쿼리 - 인덱스 문제를 방지하기 위해 정렬만 적용
        // 카테고리 필터링은 클라이언트에서 처리
        const toolsQuery = query(
          collection(db, 'tools')
        );

        // 일회성 쿼리로 모든 도구 가져오기
        try {
          console.log('📥 일회성 쿼리 실행');
          const snapshot = await getDocs(toolsQuery);
          
          console.log('📊 일회성 쿼리 응답 받음, 문서 수:', snapshot.size);
          const tools: FirebaseTool[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data() as any;
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
          
          setAllTools(tools);
          setIsLoading(false);
          setError(null);
        } catch (error: any) {
          console.error('❌ 일회성 쿼리 실패:', error);
          setError('도구 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('❌ 도구 목록 쿼리 설정 실패:', error);
        setError('도구 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsLoading(false);
      }
    };
    
    // 데이터 로드 시작
    loadData();
    
    // 클린업 함수
    return () => {
      if (unsubscribe) {
        console.log('🧹 실시간 구독 해제');
        unsubscribe();
      }
    };
  }, []);

  // 클라이언트 측에서 필터링 및 정렬 적용
  useEffect(() => {
    if (allTools.length === 0) return;

    console.log('🔍 클라이언트 측 필터링 및 정렬 적용', { category, sortOrder });
    
    // 필터링된 도구 목록
    let filteredTools = [...allTools];
    
    // 카테고리 필터링
    if (category && category !== '전체') {
      console.log('📂 카테고리 필터 적용:', category);
      filteredTools = filteredTools.filter(tool => tool.category === category);
    }
    
    // 정렬 적용
    filteredTools.sort((a, b) => {
      switch (sortOrder) {
        case 'rating_desc':
          return b.averageRating - a.averageRating;
        case 'rating_asc':
          return a.averageRating - b.averageRating;
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'created_asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'updated_desc':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'updated_asc':
          return a.updatedAt.getTime() - b.updatedAt.getTime();
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });
    
    console.log('📊 필터링 및 정렬 후 도구 수:', filteredTools.length);
    setData(filteredTools);
  }, [allTools, category, sortOrder]);

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
      
      // 로컬 상태 업데이트 (실시간 구독이 없으므로)
      setAllTools(prevTools => {
        const updatedTools = prevTools.map(tool => {
          if (tool.id === toolId) {
            return {
              ...tool,
              ...toolData,
              updatedAt: new Date()
            };
          }
          return tool;
        });
        return updatedTools;
      });
      
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
      
      // 로컬 상태 업데이트 (실시간 구독이 없으므로)
      setAllTools(prevTools => prevTools.filter(tool => tool.id !== toolId));
      
    } catch (error: any) {
      console.error('❌ 도구 삭제 실패:', error);
      throw new Error(error.message || '도구 삭제 중 오류가 발생했습니다.');
    }
  };

  // 사용 가능한 카테고리 목록 추출
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(allTools.map(tool => tool.category))];
    return ['전체', ...uniqueCategories.sort()];
  }, [allTools]);

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
      // 특정 도구 문서 조회 (일회성 쿼리)
      const fetchTool = async () => {
        try {
          const toolRef = doc(db, 'tools', toolId);
          const docSnap = await getDocs(query(collection(db, 'tools'), where('__name__', '==', toolId)));
          
          if (!docSnap.empty) {
            const docData = docSnap.docs[0].data() as any;
            
            setData({
              id: docSnap.docs[0].id,
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
            setIsLoading(false);
          } else {
            setError('도구를 찾을 수 없습니다.');
            setIsLoading(false);
          }
        } catch (error: any) {
          console.error('❌ 도구 조회 실패:', error);
          setError('도구 정보를 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
        }
      };
      
      fetchTool();
    } catch (error: any) {
      console.error('❌ 도구 쿼리 설정 실패:', error);
      setError(error.message || '도구 정보 설정 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [toolId]);

  return {
    data,
    isLoading,
    error
  };
} 